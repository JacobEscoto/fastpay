export function generateSolanaPayUrl(handle: string, amount?: number): string {
    const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
    const baseUrl = `https://fastpay-sol.vercel.app/@${cleanHandle}`;

    if (amount && amount > 0) {
        return `${baseUrl}?amount=${amount}`;
    }

    return baseUrl;
}

export function formatWalletAddress(address: string, chars = 6): string {
    if (!address || address.length < chars * 2) return address
    return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export async function convertSvgToPngBlob(svgElement: SVGSVGElement, size = 200): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const serializer = new XMLSerializer()
        const svgStr = serializer.serializeToString(svgElement)
        const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })

        const url = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext("2d")!
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, size, size)
            ctx.drawImage(img, 0, 0, size, size)
            URL.revokeObjectURL(url)

            canvas.toBlob(blob => {
                if (blob) resolve(blob)
                else reject(new Error("Canvas toBlob failed"))
            }, "image/png")
        }

        img.onerror = reject
        img.src = url
    })
}