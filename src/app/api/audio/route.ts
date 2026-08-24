import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fetchFromDrive(fileId: string, rangeHeader: string | null, customEndpoint?: string | null): Promise<Response | null> {
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  const baseHeaders: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': '*/*',
  };
  if (rangeHeader) {
    baseHeaders['Range'] = rangeHeader;
  }

  // Stage 1: Google lh3 CDN direct media proxy (Fastest for public Drive files)
  try {
    const lh3Url = `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
    const lh3Res = await fetch(lh3Url, {
      headers: baseHeaders,
      redirect: 'follow',
    });
    const cType = lh3Res.headers.get('content-type') || '';
    if (lh3Res.ok && !cType.includes('text/html') && !cType.includes('text/plain')) {
      return lh3Res;
    }
  } catch (err) {
    console.warn('Drive lh3 CDN attempt note:', err);
  }

  // Stage 2: Direct usercontent download endpoint
  try {
    const usercontentUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&authuser=0`;
    const usercontentRes = await fetch(usercontentUrl, {
      headers: baseHeaders,
      redirect: 'follow',
    });
    const cType = usercontentRes.headers.get('content-type') || '';
    if (usercontentRes.ok && !cType.includes('text/html') && !cType.includes('text/plain')) {
      return usercontentRes;
    }
  } catch (err) {
    console.warn('Drive usercontent attempt note:', err);
  }

  // Stage 3: Direct docs.google.com UC endpoint with form & cookie confirmation parsing
  try {
    const ucUrl = `https://docs.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
    const initRes = await fetch(ucUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual',
    });

    const setCookies = initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie') || ''];
    const cookieHeader = setCookies.filter(Boolean).map((c) => c.split(';')[0]).join('; ');
    const location = initRes.headers.get('location');

    if (location) {
      const locRes = await fetch(location, {
        headers: {
          ...baseHeaders,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        redirect: 'follow',
      });
      const cType = locRes.headers.get('content-type') || '';
      if (locRes.ok && !cType.includes('text/html')) {
        return locRes;
      }
    }

    const html = await initRes.text();
    const formActionMatch = html.match(/<form[^>]+action="([^"]+)"/i);
    const confirmMatch =
      html.match(/name="confirm"\s+value="([^"]+)"/i) ||
      html.match(/confirm=([0-9A-Za-z_-]+)/i);
    const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/i);

    const action = formActionMatch ? formActionMatch[1] : 'https://drive.usercontent.google.com/download';
    const params = new URLSearchParams({
      id: fileId,
      export: 'download',
      confirm: confirmMatch ? confirmMatch[1] : 't',
    });
    if (uuidMatch) params.set('uuid', uuidMatch[1]);

    const finalUrl = `${action}?${params.toString()}`;
    const confirmedRes = await fetch(finalUrl, {
      headers: {
        ...baseHeaders,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      redirect: 'follow',
    });

    const finalCType = confirmedRes.headers.get('content-type') || '';
    if (confirmedRes.ok && !finalCType.includes('text/html')) {
      return confirmedRes;
    }
  } catch (err) {
    console.warn('Drive confirmation flow note:', err);
  }

  // Stage 4: Google Apps Script Web App fallback
  const gasEndpoint = customEndpoint || process.env.NEXT_PUBLIC_APPSCRIPT_URL;
  if (gasEndpoint) {
    try {
      const gasRes = await fetch(`${gasEndpoint}?action=getAudio&fileId=${encodeURIComponent(fileId)}`, {
        method: 'GET',
      });
      if (gasRes.ok) {
        const gasData = await gasRes.json();
        if (gasData.status === 'success' && gasData.base64) {
          const cleanBase64 = gasData.base64.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': gasData.mimeType || 'audio/mpeg',
              'Content-Length': String(buffer.length),
              'Accept-Ranges': 'bytes',
            },
          });
        }
      }
    } catch (err) {
      console.warn('Apps Script backend fallback note:', err);
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId') || searchParams.get('id');
    const directUrl = searchParams.get('url');
    const endpoint = searchParams.get('endpoint');

    if (!fileId && !directUrl) {
      return NextResponse.json(
        { error: 'Missing fileId or url parameter' },
        { status: 400 }
      );
    }

    const rangeHeader = request.headers.get('range');
    let driveRes: Response | null = null;

    if (directUrl) {
      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      };
      if (rangeHeader) headers['Range'] = rangeHeader;
      driveRes = await fetch(directUrl, { headers, redirect: 'follow' });
    } else if (fileId) {
      driveRes = await fetchFromDrive(fileId, rangeHeader, endpoint);
    }

    if (!driveRes || (!driveRes.ok && driveRes.status !== 206)) {
      return NextResponse.json(
        { error: 'Could not resolve audio stream from Google Drive' },
        { status: driveRes?.status || 502 }
      );
    }

    const rawType = driveRes.headers.get('content-type') || 'audio/mpeg';
    const contentType = rawType.includes('text/html') || rawType.includes('text/plain') ? 'audio/mpeg' : rawType;
    const contentLength = driveRes.headers.get('content-length');
    const contentRange = driveRes.headers.get('content-range');
    const acceptRanges = driveRes.headers.get('accept-ranges') || 'bytes';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Accept-Ranges', acceptRanges);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new NextResponse(driveRes.body, {
      status: driveRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Audio streaming error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while streaming audio: ' + (error.message || String(error)) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    },
  });
}
