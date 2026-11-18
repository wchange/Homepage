const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const destination = path.join(__dirname, '../assets/qr');
  await fs.mkdir(destination, { recursive: true });
  const links = {
    bilibili: 'https://space.bilibili.com/113447',
    qq: 'https://qm.qq.com/q/aDLJezEL50',
    xiaohongshu: 'https://xhslink.cn/o/BzvD75EQ4m',
    steam: 'https://store.steampowered.com/app/3566350/Seal_Shark_Diary/'
  };
  for (const [name, url] of Object.entries(links)) {
    const buffer = await QRCode.toBuffer(url, {width:320,margin:4,errorCorrectionLevel:'M'});
    const png = PNG.sync.read(buffer);
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    if (decoded?.data !== url) throw new Error(`二维码解码校验失败: ${name}`);
    await fs.writeFile(path.join(destination, `${name}.png`), buffer);
    console.log(`已生成并解码验证 ${name}: ${decoded.data}`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
