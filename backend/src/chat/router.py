"""
Chat Router — API endpoints for real-time channels and messaging.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, status
from pydantic import BaseModel
from sqlalchemy import desc, select

from src.auth.models import User
from src.chat.models import ChatMember, ChatRoom, Message
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
    stmt = (
        select(
            ChatRoom.id,
            ChatRoom.room_name,
            ChatRoom.created_by,
            ChatRoom.created_at,
            User.full_name,
            User.avatar_url,
        )
        .outerjoin(User, ChatRoom.created_by == User.id)
        .where(ChatRoom.is_active.is_(True))
        .order_by(desc(ChatRoom.created_at))
    )
    res = await db.execute(stmt)
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.post("/rooms", status_code=status.HTTP_201_CREATED, summary="Create chat room")
async def create_room(data: RoomCreate, user_id: CurrentUserId, db: DBSession):
    """Create a new chat channel."""
    room = ChatRoom(
        created_by=user_id,
        room_name=data.room_name,
        property_id=data.property_id,
        is_active=True,
    )
    db.add(room)
    await db.flush()

    member = ChatMember(
        room_id=room.id,
        user_id=user_id,
    )
    db.add(member)
    await db.commit()
    await db.refresh(room)

    return {
        "id": room.id,
        "room_name": room.room_name,
        "created_by": room.created_by,
        "property_id": room.property_id,
        "is_active": room.is_active,
        "created_at": room.created_at,
    }


@router.get("/rooms/{room_id}/messages", summary="Get room messages")
async def get_room_messages(room_id: uuid.UUID, db: DBSession):
    """Fetch messages in a room."""
    stmt = (
        select(
            Message.id,
            Message.room_id,
            Message.sender_id,
            Message.content,
            Message.message_type,
            Message.created_at,
            User.full_name,
            User.avatar_url,
        )
        .outerjoin(User, Message.sender_id == User.id)
        .where(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
    )
    res = await db.execute(stmt)
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.post("/rooms/{room_id}/messages", status_code=status.HTTP_201_CREATED, summary="Send message")
async def send_message(room_id: uuid.UUID, data: MessageCreate, user_id: CurrentUserId, db: DBSession):
    """Send a message to a chat channel."""
    msg = Message(
        room_id=room_id,
        sender_id=user_id,
        content=data.content,
        message_type=data.message_type,
        is_read=False,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return {
        "id": msg.id,
        "room_id": msg.room_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "message_type": msg.message_type,
        "is_read": msg.is_read,
        "created_at": msg.created_at,
    }
