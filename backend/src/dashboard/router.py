"""
Dashboard Router — API endpoints for consolidated user metrics and system stats.
"""

from fastapi import APIRouter
from sqlalchemy import func, select

from src.auth.models import User
from src.chat.models import Message
from src.core.dependencies import CurrentUserId, DBSession
from src.dashboard.models import Notification, PropertyInquiry
from src.properties.models import Bookmark, Property

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", summary="Get user dashboard stats")
async def get_dashboard_stats(user_id: CurrentUserId, db: DBSession):
    """Retrieve real database counts for current user."""
    # 1. Listings count
    stmt_listings = select(func.count(Property.id)).where(Property.owner_id == user_id)
    my_listings_count = (await db.execute(stmt_listings)).scalar() or 0

    # 2. Saved properties count
    stmt_saved = select(func.count(Bookmark.id)).where(Bookmark.user_id == user_id)
    saved_count = (await db.execute(stmt_saved)).scalar() or 0

    # 3. Messages count
    stmt_msg = select(func.count(Message.id)).where(Message.sender_id == user_id)
    messages_count = (await db.execute(stmt_msg)).scalar() or 0

    # 4. Notifications count
    stmt_notif = select(func.count(Notification.id)).where(Notification.user_id == user_id)
    notifications_count = (await db.execute(stmt_notif)).scalar() or 0

    # 5. Inquiries count
    stmt_inq = select(func.count(PropertyInquiry.id)).where(PropertyInquiry.user_id == user_id)
    inquiries_count = (await db.execute(stmt_inq)).scalar() or 0

    # 6. Total users & properties for platform
    stmt_u = select(func.count(User.id))
    total_users = (await db.execute(stmt_u)).scalar() or 0

    stmt_p = select(func.count(Property.id))
    total_properties = (await db.execute(stmt_p)).scalar() or 0

    return {
        "user_id": str(user_id),
        "my_listings_count": my_listings_count,
        "saved_count": saved_count,
        "messages_count": messages_count,
        "notifications_count": notifications_count,
        "inquiries_count": inquiries_count,
        "platform_total_users": total_users,
        "platform_total_properties": total_properties,
    }
