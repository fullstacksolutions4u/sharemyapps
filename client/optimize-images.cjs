const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (fullPath.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('t:/Projects/Full Stack Solutions/sharemyapps/client/src');
let updatedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Variables to wrap with optimizeImage
  const varsToWrap150 = [
    'avatarUrl', 'user.avatar', 'owner.avatar', 'c.avatar', 'dev.avatar', 'd.avatar', 'u.avatar',
    'a.user.avatar', 'msg.sender.avatar', 'offer.user.avatar', 'o.user.avatar', 'session.user.avatar',
    'userData.profile.avatar', 'p.avatar', 'initial.owner.avatar', 'initial.avatar',
    'jdHistoryUser.avatar', 'portfolioVisitsUser.avatar', 'visit.user.avatar', 'messagingUser.avatar',
    'authUser.avatar', 'mentor.avatar', 'person.avatar', 'c.user.avatar',
    'user?.avatar', 'u?.avatar', 'project?.bannerImage'
  ];
  
  const varsToWrap800 = [
    'project.bannerImage', 'bannerSrc'
  ];

  let modified = false;

  varsToWrap150.forEach(v => {
    const regex = new RegExp(`src=\\{${v.replace(/\./g, '\\.').replace(/\?/g, '\\?')}\\}`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `src={optimizeImage(${v}, 150)}`);
      modified = true;
    }
  });

  varsToWrap800.forEach(v => {
    const regex = new RegExp(`src=\\{${v.replace(/\./g, '\\.').replace(/\?/g, '\\?')}\\}`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `src={optimizeImage(${v}, 800)}`);
      modified = true;
    }
  });
  
  // Handle complex cases
  if (content.includes('src={getbanner(')) {
    content = content.replace(/src=\{getbanner\(([^)]+)\)\}/g, 'src={optimizeImage(getbanner($1), 800)}');
    modified = true;
  }
  if (content.includes('src={getBanner(')) {
    content = content.replace(/src=\{getBanner\(([^)]+)\)\}/g, 'src={optimizeImage(getBanner($1), 800)}');
    modified = true;
  }
  
  if (content.includes('c.user?.profileImage || c.user?.avatar')) {
    content = content.replace(/src=\{c\.user\?\.profileImage \|\| c\.user\?\.avatar \|\| `([^`]+)`\}/g, 'src={optimizeImage(c.user?.profileImage || c.user?.avatar || `$1`, 150)}');
    modified = true;
  }
  
  if (content.includes('user.profileImage || `https://ui-avatars.com')) {
     content = content.replace(/src=\{user\.profileImage \|\| `([^`]+)`\}/g, 'src={optimizeImage(user.profileImage || `$1`, 150)}');
     modified = true;
  }
  if (content.includes('u.profileImage || `https://ui-avatars.com')) {
     content = content.replace(/src=\{u\.profileImage \|\| `([^`]+)`\}/g, 'src={optimizeImage(u.profileImage || `$1`, 150)}');
     modified = true;
  }

  if (modified) {
    if (!original.includes('optimizeImage')) {
      // Calculate relative path to utils/image
      const normalizedFile = file.replace(/\\/g, '/');
      const srcIndex = normalizedFile.indexOf('/client/src/') + 12;
      const relPathStr = normalizedFile.substring(srcIndex);
      const depth = relPathStr.split('/').length - 1;
      const relPath = depth === 0 ? './utils/image' : '../'.repeat(depth) + 'utils/image';
      
      const importStmt = `import { optimizeImage } from '${relPath}';\n`;
      
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + importStmt + content.slice(endOfLine + 1);
      } else {
        content = importStmt + content;
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    updatedFiles++;
    console.log(`Updated ${file}`);
  }
});
console.log(`Updated ${updatedFiles} files.`);
