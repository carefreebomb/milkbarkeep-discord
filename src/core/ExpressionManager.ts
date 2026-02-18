import { EmoteManager } from "./EmoteManager";
import { ExtendedClient } from "./ExtendedClient";
import { StickerManager } from "./StickerManager";

export class ExpressionManager {
    private clientRef: ExtendedClient;
    public emotes: EmoteManager;
    public stickers: StickerManager;

    constructor(clientRef: ExtendedClient) {
        this.clientRef = clientRef;
        this.emotes = new EmoteManager(clientRef);
        this.stickers = new StickerManager(clientRef);
    }
}