export const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('uz-UZ', {
        timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit'
    });

export const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('uz-UZ', {
        timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric'
    });

export const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};
