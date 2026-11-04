"""
Posts Router — API endpoints for feed posts, likes, and comments.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import CurrentUserId, DBSession, OptionalUserId
from src.auth.schemas import MessageResponse

router = APIRouter(prefix="/posts", tags=["Posts"])


class PostCreate(BaseModel):
    title: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    property_id: Optional[uuid.UUID] = None


class CommentCreate(BaseModel):
    content: str


@router.get("", summary="Get all feed posts")
async def get_posts(db: DBSession, limit: int = Query(20, ge=1, le=100)):
    """Fetch recent feed posts with user details."""
    query = """
        SELECT 
            p.id, p.user_id, p.property_id, p.title, p.content, p.image_url, 
            p.likes_count, p.comments_count, p.created_at,
            prof.full_name, prof.avatar_url, prof.role
        FROM posts p
        LEFT JOIN profiles prof ON p.user_id = prof.id
        ORDER BY p.created_at DESC
        LIMIT :limit;
    """
    from sqlalchemy import text
    res = await db.execute(text(query), {"limit": limit})
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a feed post")
async def create_post(data: PostCreate, user_id: CurrentUserId, db: DBSession):
    """Create a new post in the database."""
    from sqlalchemy import text
    post_id = uuid.uuid4()
    query = """
        INSERT INTO posts (id, user_id, property_id, title, content, image_url, likes_count, comments_count, created_at, updated_at)
        VALUES (:id, :user_id, :property_id, :title, :content, :image_url, 0, 0, NOW(), NOW())
        RETURNING *;
    """
    res = await db.execute(text(query), {
        "id": post_id,
        "user_id": user_id,
        "property_id": data.property_id,
        "title": data.title,
        "content": data.content,
        "image_url": data.image_url,
    })
    await db.commit()
    row = res.mappings().first()
    return dict(row) if row else {"id": str(post_id), "status": "created"}


@router.post("/{post_id}/like", summary="Like or unlike a post")
async def toggle_like(post_id: uuid.UUID, user_id: CurrentUserId, db: DBSession):
    """Toggle like on a post."""
    from sqlalchemy import text
    check_query = "SELECT id FROM likes WHERE user_id = :user_id AND post_id = :post_id;"
    existing = (await db.execute(text(check_query), {"user_id": user_id, "post_id": post_id})).first()

    if existing:
        await db.execute(text("DELETE FROM likes WHERE user_id = :user_id AND post_id = :post_id;"), {"user_id": user_id, "post_id": post_id})
        await db.execute(text("UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = :post_id;"), {"post_id": post_id})
        await db.commit()
        return {"liked": False, "message": "Unliked post"}
    else:
        like_id = uuid.uuid4()
        await db.execute(text("INSERT INTO likes (id, user_id, post_id, created_at) VALUES (:id, :user_id, :post_id, NOW());"), {"id": like_id, "user_id": user_id, "post_id": post_id})
        await db.execute(text("UPDATE posts SET likes_count = likes_count + 1 WHERE id = :post_id;"), {"post_id": post_id})
        await db.commit()
        return {"liked": True, "message": "Liked post"}


@router.post("/{post_id}/comments", summary="Comment on a post")
async def add_comment(post_id: uuid.UUID, data: CommentCreate, user_id: CurrentUserId, db: DBSession):
    """Add a comment to a post."""
    from sqlalchemy import text
    comment_id = uuid.uuid4()
    query = """
        INSERT INTO comments (id, user_id, post_id, content, created_at)
        VALUES (:id, :user_id, :post_id, :content, NOW())
        RETURNING *;
    """
    res = await db.execute(text(query), {"id": comment_id, "user_id": user_id, "post_id": post_id, "content": data.content})
    await db.execute(text("UPDATE posts SET comments_count = comments_count + 1 WHERE id = :post_id;"), {"post_id": post_id})
    await db.commit()
    row = res.mappings().first()
    return dict(row) if row else {"id": str(comment_id), "status": "created"}
