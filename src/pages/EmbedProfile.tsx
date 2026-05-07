import { UserProfileModal } from '../components/ui/UserProfileModal';
import { useAuth } from '../context/AuthContext';

export const EmbedProfile = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-bold bg-transparent">Cargando datos del perfil...</div>;
    if (!user) return <div className="flex h-screen items-center justify-center text-rose-500 font-bold bg-transparent">Error de Autenticación.</div>;

    return (
        <div className="h-screen w-full bg-transparent overflow-hidden">
             <UserProfileModal 
                isOpen={true} 
                onClose={() => {
                    window.parent.postMessage({ type: 'CLOSE_NEXUS_PROFILE' }, '*');
                }} 
             />
        </div>
    );
};
