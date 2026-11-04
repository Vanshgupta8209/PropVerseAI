"""
Chat Router — API endpoints for real-time channels and messaging.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import text

from src.core.dependencies import CurrentUserId, DBSession

router = APIRouter(prefix="/chat", tags=["Chat"])


class RoomCreate(BaseModel):
    room_name: str
    property_id: Optional[uuid.UUID] = None


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"


@router.get("/rooms", summary="List chat rooms")
async def get_chat_rooms(db: DBSession):
    """Fetch all active chat channels."""
    query = """
        SELECT cr.id, cr.room_name, cr.created_by, cr.created_at, prof.full_name, prof.avatar_url
        FROM chat_rooms cr
        LEFT JOIN profiles prof ON cr.created_by = prof.id
        WHERE cr.is_active = true
        ORDER BY cr.created_at DESC;
    """
    res = await db.execute(text(query))
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.post("/rooms", status_code=status.HTTP_201_CREATED, summary="Create chat room")
async def create_room(data: RoomCreate, user_id: CurrentUserId, db: DBSession):
    """Create a new chat channel."""
    room_id = uuid.uuid4()
    query = """
        INSERT INTO chat_rooms (id, created_by, room_name, property_id, is_active, created_at)
        VALUES (:id, :created_by, :room_name, :property_id, true, NOW())
        RETURNING *;
    """
    res = await db.execute(text(query), {
        "id": room_id,
        "created_by": user_id,
        "room_name": data.room_name,
        "property_id": data.property_id,
    })
    # Add creator as room member
    await db.execute(text("INSERT INTO chat_members (id, room_id, user_id, joined_at) VALUES (:id, :room_id, :user_id, NOW());"), {
        "id": uuid.uuid4(),
        "room_id": room_id,
        "user_id": user_id,
    })
    await db.commit()
    row = res.mappings().first()
    return dict(row) if row else {"id": str(room_id)}


@router.get("/rooms/{room_id}/messages", summary="Get room messages")
async def get_room_messages(room_id: uuid.UUID, db: DBSession):
    """Fetch messages in a room."""
    query = """
        SELECT m.id, m.room_id, m.sender_id, m.content, m.message_type, m.created_at, prof.full_name, prof.avatar_url
        FROM messages m
        LEFT JOIN profiles prof ON m.sender_id = prof.id
        WHERE m.room_id = :room_id
        ORDER BY m.created_at ASC;
    """
    res = await db.execute(text(query), {"room_id": room_id})
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.post("/rooms/{room_id}/messages", status_code=status.HTTP_201_CREATED, summary="Send message")
async def send_message(room_id: uuid.UUID, data: MessageCreate, user_id: CurrentUserId, db: DBSession):
    """Send a message to a chat channel."""
    msg_id = uuid.uuid4()
    query = """
        INSERT INTO messages (id, room_id, sender_id, content, message_type, is_read, created_at)
        VALUES (:id, :room_id, :sender_id, :content, :message_type, false, NOW())
        RETURNING *;
    """
    res = await db.execute(text(query), {
        "id": msg_id,
        "room_id": room_id,
        "sender_id": user_id,
        "content": data.content,
        "message_type": data.message_type,
    })
    await db.commit()
    row = res.mappings().first()
    return dict(row) if row else {"id": str(msg_id)}
