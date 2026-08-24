import https from 'https';

async function testDriveDownload(fileId) {
  console.log('Testing Drive download for fileId:', fileId);
  const ucUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

  const res1 = await fetch(ucUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'manual',
  });

  console.log('Res 1 status:', res1.status);
  const cookies = res1.headers.getSetCookie ? res1.headers.getSetCookie() : [res1.headers.get('set-cookie') || ''];
  const cookieStr = cookies.filter(Boolean).map(c => c.split(';')[0]).join('; ');
  console.log('Cookies:', cookieStr);

  const loc = res1.headers.get('location');
  console.log('Location:', loc);

  if (loc) {
    const resLoc = await fetch(loc, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookieStr,
      },
    });
    console.log('Loc status:', resLoc.status, 'Type:', resLoc.headers.get('content-type'), 'Length:', resLoc.headers.get('content-length'));
    return;
  }

  const html = await res1.text();
  console.log('HTML length:', html.length);

  // Parse download form / link from html
  const formActionMatch = html.match(/<form[^>]+action="([^"]+)"/i);
  const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/i) || html.match(/confirm=([0-9A-Za-z_-]+)/i);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/i);

  console.log('formAction:', formActionMatch?.[1]);
  console.log('confirm:', confirmMatch?.[1]);
  console.log('uuid:', uuidMatch?.[1]);

  if (confirmMatch) {
    const action = formActionMatch ? formActionMatch[1] : 'https://drive.usercontent.google.com/download';
    const params = new URLSearchParams({
      id: fileId,
      export: 'download',
      confirm: confirmMatch[1],
    });
    if (uuidMatch) params.set('uuid', uuidMatch[1]);

    const finalUrl = `${action}?${params.toString()}`;
    console.log('Final URL:', finalUrl);

    const res2 = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookieStr,
        'Accept': '*/*',
      },
    });

    console.log('Final status:', res2.status, 'Type:', res2.headers.get('content-type'), 'Length:', res2.headers.get('content-length'));
  }
}

// Let's test with a test public Drive ID or search
testDriveDownload('1-0XQ64V6S0Q-Sample').catch(console.error);
