import { Drawer } from 'expo-router/drawer';
import DrawerContent from '../../../components/DrawerContent';
import TopBar from '../../../components/TopBar';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        header: (props) => <TopBar {...props} />,
        drawerType: 'front',
      }}
    >
      <Drawer.Screen name="accueil" options={{ title: 'Accueil' }} />
      <Drawer.Screen name="caisse" options={{ title: 'Caisse' }} />
      <Drawer.Screen name="cotisations" options={{ title: 'Cotisations' }} />
      <Drawer.Screen name="ma-fiche-cotisation" options={{ title: 'Ma cotisation' }} />
      <Drawer.Screen name="actualites" options={{ title: 'Actualites' }} />
      <Drawer.Screen name="messagerie" options={{ title: 'Messagerie' }} />
      <Drawer.Screen name="annuaire" options={{ title: 'Annuaire' }} />
      <Drawer.Screen name="mon-profil" options={{ title: 'Mon profil' }} />
      <Drawer.Screen name="(bureau)" options={{ title: 'Bureau' }} />
    </Drawer>
  );
}
