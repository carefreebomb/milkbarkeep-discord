import { AppletonCam } from "./AppletonCam";
import { Birthdays } from "./Birthdays";
import { ExtendedClient } from "./ExtendedClient";
import { Cron } from "croner";

export class Scheduler {
    clientRef: ExtendedClient;

    constructor(client: ExtendedClient) {
        this.clientRef = client;
    }

    // https://breejs.github.io/later/parsers.html
    // https://en.wikipedia.org/wiki/Cron
    // "cron: minute hour dayofmonth month dayofweek"
    public async initialize(): Promise<void> {
        this.schedule("0 0 * * *", () => { this.midnightChecks(); });
        //cron.schedule("*/10 * * * *", () => { this.clientRef.bsky.updateAllFeeds(10); });
        this.schedule("*/10 * * * *", () => { this.clientRef.ra.updateAllFeeds(10); });
        this.schedule("58 17 * * 0", () => { this.clientRef.ra.weeklyReport(); });
        //cron.schedule("0 * * * *", () => { AppletonCam.sendToAll(this.clientRef); });
    }

    private schedule(expression: string, callback: () => void): Cron<undefined> {
        return new Cron(expression, {
            timezone: "America/Chicago"
        }, callback);
    }

    private midnightChecks(): void {
        this.clientRef.logger.rotate();
        Birthdays.check(this.clientRef);
    }
}