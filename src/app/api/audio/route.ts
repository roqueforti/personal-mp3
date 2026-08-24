import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fetchFromDrive(fileId: string, rangeHeader: string | null) {
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  const baseHeaders: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': '*/*',
  };
  if (rangeHeader) {
    baseHeaders['Range'] = rangeHeader;
  }

  // Attempt 1: Direct usercontent CDN URL (fastest & handles media streaming directly)
  const cdnUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&authuser=0`;
  try {
    const res = await fetch(cdnUrl, {
      headers: baseHeaders,
      redirect: 'follow',
    });
    const cType = res.headers.get('content-type') || '';
    if (res.ok && !cType.includes('text/html')) {
      return res;
    }
  } catch (err) {
    console.warn('Drive CDN fetch failed, trying doc uc URL:', err);
  }

  // Attempt 2: Direct Google Drive UC URL
  const ucUrl = `https://docs.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
  try {
    const initRes = await fetch(ucUrl, {
      headers: baseHeaders,
      redirect: 'manual',
    });

    const setCookies = initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie') || ''];
    const cookieHeader = setCookies.filter(Boolean).join('; ');
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

    // Attempt 3: If confirmation page returned (large files)
    const text = await initRes.text();
    const confirmMatch =
      text.match(/confirm=([0-9A-Za-z_-]+)/) ||
      text.match(/name="confirm"\s+value="([^"]+)"/);
    const confirmToken = confirmMatch ? confirmMatch[1] : 't';

    const confirmedUrl = `https://docs.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=${confirmToken}`;
    const confirmedRes = await fetch(confirmedUrl, {
      headers: {
        ...baseHeaders,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      redirect: 'follow',
    });

    return confirmedRes;
  } catch (err) {
    console.warn('Drive confirmation fetch failed:', err);
  }

  // Attempt 4: lh3 CDN
  const lh3Url = `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
  return await fetch(lh3Url, {
    headers: baseHeaders,
    redirect: 'follow',
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId') || searchParams.get('id');
    const directUrl = searchParams.get('url');

    if (!fileId && !directUrl) {
      return NextResponse.json(
        { error: 'Missing fileId or url parameter' },
        { status: 400 }
      );
    }

    const rangeHeader = request.headers.get('range');
    let driveRes: Response;

    if (directUrl) {
      const headers: Record<string, string> = {};
      if (rangeHeader) headers['Range'] = rangeHeader;
      driveRes = await fetch(directUrl, { headers, redirect: 'follow' });
    } else if (fileId) {
      driveRes = await fetchFromDrive(fileId, rangeHeader);
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (!driveRes.ok && driveRes.status !== 206) {
      return NextResponse.json(
        { error: `Failed to fetch audio stream from upstream (${driveRes.status})` },
        { status: driveRes.status || 502 }
      );
    }

    const contentType = driveRes.headers.get('content-type') || 'audio/mpeg';
    const contentLength = driveRes.headers.get('content-length');
    const contentRange = driveRes.headers.get('content-range');
    const acceptRanges = driveRes.headers.get('accept-ranges') || 'bytes';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType.includes('text/html') ? 'audio/mpeg' : contentType);
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
