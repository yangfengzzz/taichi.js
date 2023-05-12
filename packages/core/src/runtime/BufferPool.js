export class BufferPool {
    device;
    usage;
    constructor(device, usage) {
        this.device = device;
        this.usage = usage;
    }
    static pools = new Map();
    static getPool(device, usage) {
        if (!this.pools.has(usage)) {
            let pool = new BufferPool(device, usage);
            this.pools.set(usage, pool);
        }
        return this.pools.get(usage);
    }
    buffers = new Set();
    getBuffer(size) {
        let selectedPair = undefined;
        for (let pair of this.buffers.keys()) {
            if (pair.size >= size) {
                selectedPair = pair;
                break;
            }
        }
        if (selectedPair) {
            this.buffers.delete(selectedPair);
            return selectedPair;
        }
        let buffer = this.device.createBuffer({
            size: size,
            usage: this.usage
        });
        return {
            buffer: buffer,
            size: size
        };
    }
    returnBuffer(buffer) {
        this.buffers.add(buffer);
    }
}
