const fs = require('fs');

const files = [
  'client/src/components/SensorPermissionGate.tsx',
  'client/src/components/BottomNavigation.tsx',
  'client/src/components/Header.tsx',
  'client/src/components/ProfileCard.tsx',
  'client/src/components/ConnectInteraction.tsx',
  'client/src/components/ConnectOverlay.tsx',
  'client/src/components/FilterDrawer.tsx',
  'client/src/components/BeenBumpedBadge.tsx',
  'client/src/components/NotificationsModal.tsx',
  'client/src/pages/Messages.tsx',
  'client/src/pages/Profile.tsx'
];

files.forEach(f => {
  try {
    let d = fs.readFileSync(f, 'utf8');
    d = d.replace(/backdrop-blur(-\w+)?/g, '');
    d = d.replace(/backdropFilter:\s*["'][^"']+["'],?/g, '');
    fs.writeFileSync(f, d);
    console.log('Stripped blur from', f);
  } catch (e) {
    console.error('Error with', f, e.message);
  }
});
