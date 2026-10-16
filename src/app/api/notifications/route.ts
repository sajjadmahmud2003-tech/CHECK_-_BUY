import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { dataStore, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const notifications = typeof dataStore?.getNotifications === 'function'
      ? dataStore.getNotifications(user.id)
      : getNotifications(user.id);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      dataStore.markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId is required.' },
        { status: 400 }
      );
    }

    const updated = dataStore.markNotificationAsRead(notificationId, user.id);
    return NextResponse.json({ success: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
