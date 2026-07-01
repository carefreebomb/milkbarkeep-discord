import { Birthdays } from "./Birthdays";
import { ExtendedClient } from "./ExtendedClient";
import { Cron } from "croner";

export class Scheduler {
    clientRef: ExtendedClient;

    constructor(client: ExtendedClient) {
        this.clientRef = client;
    }

    // https://en.wikipedia.org/wiki/Cron
    // "cron: minute hour dayofmonth month dayofweek"
    public async initialize(): Promise<void> {
        this.schedule("0 0 * * *", () => { this.midnightChecks(); });
        this.schedule("*/10 * * * *", () => { this.clientRef.ra.updateAllFeeds(10); });
        this.schedule("*/10 * * * *", () => { this.clientRef.steam.updateAllFeeds(10) });
        this.schedule("58 17 * * 0", () => { this.clientRef.ra.weeklyReport(); });
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