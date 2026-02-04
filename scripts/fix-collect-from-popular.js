const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/influencer-collector.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 查找 collectFromPopular 方法
const methodStart = content.indexOf('  /**\n   * 从热门视频采集达人');
const methodEnd = content.indexOf('\n\n  /**\n   * 计算统计数据', methodStart);

if (methodStart !== -1 && methodEnd !== -1) {
  // 注释掉整个方法
  const methodCode = content.substring(methodStart, methodEnd);
  const commentedMethod = methodCode.split('\n').map(line => '  // ' + line).join('\n');

  const newContent = content.substring(0, methodStart) +
    '\n  // collectFromPopular 方法暂时禁用，需要修复\n  /*\n' +
    commentedMethod +
    '\n  */\n' +
    content.substring(methodEnd);

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('已注释掉 collectFromPopular 方法');
} else {
  console.log('未找到 collectFromPopular 方法');
}
