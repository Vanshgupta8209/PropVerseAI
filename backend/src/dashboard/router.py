"""
Dashboard Router — API endpoints for consolidated user metrics and system stats.
"""

from fastapi import APIRouter
from sqlalchemy import text

from src.core.dependencies import CurrentUserId, DBSession

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", summary="Get user dashboard stats")
async def get_dashboard_stats(user_id: CurrentUserId, db: DBSession):
    """Retrieve real database counts for current user."""
    # 1. Listings count
    res_listings = await db.execute(text("SELECT COUNT(*) FROM properties WHERE owner_id = :uid;"), {"uid": user_id})
    my_listings_count = res_listings.scalar() or 0

    # 2. Saved properties count
    res_saved = await db.execute(text("SELECT COUNT(*) FROM property_favorites WHERE user_id = :uid;"), {"uid": user_id})
    saved_count = res_saved.scalar() or 0

    # 3. Messages count
    res_msg = await db.execute(text("SELECT COUNT(*) FROM messages WHERE sender_id = :uid;"), {"uid": user_id})
    messages_count = res_msg.scalar() or 0

    # 4. Notifications count
    res_notif = await db.execute(text("SELECT COUNT(*) FROM notifications WHERE user_id = :uid;"), {"uid": user_id})
    notifications_count = res_notif.scalar() or 0

    # 5. Inquiries count
    res_inq = await db.execute(text("SELECT COUNT(*) FROM property_inquiries WHERE user_id = :uid;"), {"uid": user_id})
    inquiries_count = res_inq.scalar() or 0

    # 6. Total users & properties for platform
    res_u = await db.execute(text("SELECT COUNT(*) FROM profiles;"))
    total_users = res_u.scalar() or 0

    res_p = await db.execute(text("SELECT COUNT(*) FROM properties;"))
    total_properties = res_p.scalar() or 0

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
