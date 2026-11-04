"""
Posts Router — API endpoints for feed posts, likes, and comments.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select

from src.auth.models import User
from src.core.dependencies import CurrentUserId, DBSession
from src.posts.models import Post, PostComment, PostLike

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
    stmt = (
        select(
            Post.id,
            Post.user_id,
            Post.property_id,
            Post.title,
            Post.content,
            Post.image_url,
            Post.likes_count,
            Post.comments_count,
            Post.created_at,
            User.full_name,
            User.avatar_url,
            User.role,
        )
        .outerjoin(User, Post.user_id == User.id)
        .order_by(desc(Post.created_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a feed post")
async def create_post(data: PostCreate, user_id: CurrentUserId, db: DBSession):
    """Create a new post in the database."""
    post = Post(
        user_id=user_id,
        property_id=data.property_id,
        title=data.title,
        content=data.content,
        image_url=data.image_url,
        likes_count=0,
        comments_count=0,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {
        "id": post.id,
        "user_id": post.user_id,
        "property_id": post.property_id,
        "title": post.title,
        "content": post.content,
        "image_url": post.image_url,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "created_at": post.created_at,
        "status": "created",
    }


@router.post("/{post_id}/like", summary="Like or unlike a post")
async def toggle_like(post_id: uuid.UUID, user_id: CurrentUserId, db: DBSession):
    """Toggle like on a post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like_stmt = select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
    res = await db.execute(like_stmt)
    existing = res.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        post.likes_count = max(0, (post.likes_count or 0) - 1)
        await db.commit()
        return {"liked": False, "message": "Unliked post", "likes_count": post.likes_count}
    else:
        new_like = PostLike(user_id=user_id, post_id=post_id)
        db.add(new_like)
        post.likes_count = (post.likes_count or 0) + 1
        await db.commit()
        return {"liked": True, "message": "Liked post", "likes_count": post.likes_count}


@router.post("/{post_id}/comments", status_code=status.HTTP_201_CREATED, summary="Comment on a post")
async def add_comment(post_id: uuid.UUID, data: CommentCreate, user_id: CurrentUserId, db: DBSession):
    """Add a comment to a post."""
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = PostComment(
        user_id=user_id,
        post_id=post_id,
        content=data.content,
    )
    db.add(comment)
    post.comments_count = (post.comments_count or 0) + 1
    await db.commit()
    await db.refresh(comment)

    return {
        "id": comment.id,
        "user_id": comment.user_id,
        "post_id": comment.post_id,
        "content": comment.content,
        "created_at": comment.created_at,
        "status": "created",
    }
