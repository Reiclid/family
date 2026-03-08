import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default async function Icon() {
    try {
        const icoPath = path.join(process.cwd(), 'public', 'ico.png');
        const imageBuffer = fs.readFileSync(icoPath);
        const base64 = imageBuffer.toString('base64');

        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: 'transparent',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`data:image/png;base64,${base64}`}
                        alt="favicon"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            ),
            { ...size }
        );
    } catch (e) {
        console.error("Error generating icon:", e);
        // Fallback transparent circle
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: '#D4A373', // terracotta-ish
                    }}
                >
                </div>
            ),
            { ...size }
        );
    }
}
