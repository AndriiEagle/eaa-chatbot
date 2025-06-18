async getAllSessions(): Promise<any[]> {
    const { data: sessions, error } = await this.supabase
        .from('sessions')
        .select('*');

    if (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }

    return sessions.map((session: any) => ({
        sessionId: session.session_id,
        userId: session.user_id,
        createdAt: session.created_at,
    }));
} 