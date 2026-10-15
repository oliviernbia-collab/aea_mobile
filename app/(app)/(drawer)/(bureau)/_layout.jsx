import { Slot, useSegments } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import AccesRefuse from '../../../../components/AccesRefuse';

// Garde de permission par segment - reproduit <ProtectedRoute permission="..."> du web
// (frontend/src/components/ProtectedRoute.jsx) sans dupliquer la verification dans chaque ecran.
const ROUTE_PERMISSIONS = {
  'saisie-financiere': 'saisie_financiere.acceder',
  administration: 'administration.acceder',
  'journal-activite': 'journal.consulter',
  'gestion-permissions': 'permissions.gerer',
};

export default function BureauLayout() {
  const { user, hasPermission } = useAuth();
  const segments = useSegments();
  const route = segments[segments.length - 1];
  const permission = ROUTE_PERMISSIONS[route];

  const autorise = !permission || user?.role === 'super_admin' || hasPermission(permission);

  return autorise ? <Slot /> : <AccesRefuse />;
}
