/**
 * Debug Permission System
 * Use this in browser console to debug permission issues
 */

export const debugPermissions = () => {
  console.log('🔍 Permission System Debug\n');
  
  // Get userData from localStorage
  const userDataStr = localStorage.getItem('userData');
  if (!userDataStr) {
    console.error('❌ No userData found in localStorage');
    return;
  }
  
  const userData = JSON.parse(userDataStr);
  
  console.log('👤 User Info:');
  console.log('   Role:', userData.role);
  console.log('   Name:', userData.name);
  console.log('   Email:', userData.email);
  
  console.log('\n📋 Permissions:');
  if (!userData.permissions || userData.permissions.length === 0) {
    console.error('   ❌ No permissions found!');
    console.log('   This is why no menus are showing.');
  } else {
    console.log(`   ✅ Total permissions: ${userData.permissions.length}`);
    console.table(userData.permissions);
  }
  
  console.log('\n🎯 Permission Structure:');
  console.log('   Expected format:');
  console.log('   {');
  console.log('     module: "Inventory",  // Main menu name');
  console.log('     type: "view",         // Permission type');
  console.log('     granted: true         // Is granted');
  console.log('   }');
  
  if (userData.permissions && userData.permissions.length > 0) {
    const uniqueMenus = [...new Set(userData.permissions.map((p: any) => p.module))];
    console.log('\n📁 Unique Menus User Has Access To:');
    (uniqueMenus as string[]).forEach((menu: string) => {
      console.log(`   - ${menu}`);
    });
  }
  
  // Check if user is admin
  const isAdmin = userData.role === 'admin' || userData.role === 'user';
  console.log('\n👑 Is Admin?', isAdmin);
  console.log('   (Admins bypass all permission checks)');
  
  return {
    userData,
    permissions: userData.permissions,
    isAdmin,
  };
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).debugPermissions = debugPermissions;
  console.log('💡 Debug function loaded! Run debugPermissions() in console to check permissions.');
}
