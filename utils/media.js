// Certains membres ont une photo enregistree avant la migration vers Cloudinary : le backend
// stocke alors un chemin relatif (ex. "/uploads/photos/xxx.png") servi par son middleware
// express.static. Le frontend web resout ce chemin via le proxy Vite (meme origine), mais le
// mobile n'a pas de "page d'origine" - il faut prefixer explicitement avec l'URL du backend.
// Les photos recentes (Cloudinary) sont deja des URLs absolues et traversent cette fonction
// sans etre modifiees.
export function resolveMediaUrl(path) {
  if (!path) return null;
  // Deja une URI absolue (http(s), data:, file:, content:...) : rien a faire. Seul un chemin
  // commencant par "/" (reliquat du stockage local pre-Cloudinary) a besoin d'etre complete.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return path;
  const base = (process.env.EXPO_PUBLIC_SOCKET_URL || '').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
