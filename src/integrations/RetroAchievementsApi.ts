import { 
    AchievementUnlocksMetadata,
    AuthObject, 
    DatedUserAchievement, 
    GameExtended, 
    UserPoints, 
    UserRecentAchievement,
    getAchievementUnlocks, 
    getAchievementsEarnedBetween, 
    getAchievementsEarnedOnDay, 
    getGameExtended, 
    getUserPoints,
    getUserRecentAchievements
} from "@retroachievements/api";
import { Util } from "../util/Util";

import type { retroAchievementData, userPoints } from "../types/RATypes";

export class RetroAchievementsApi {

    public static readonly callDelayInMS: number = 200; // 175
    private static readonly gmtOffsetInMS: number = 21600000;

    // #region Individual Calls

    /**
     * Docs: https://api-docs.retroachievements.org/v1/get-achievement-unlocks.html
     * 
     * Repo: https://github.com/RetroAchievements/api-js/blob/main/src/achievement/getAchievementUnlocks.ts
     */
    public static async getAchievementUnlocks(auth: AuthObject, id: number, count: number = 0, offset: number = 50): Promise<AchievementUnlocksMetadata> {
        const achievement: AchievementUnlocksMetadata = await getAchievementUnlocks(auth, {
            achievementId: id,
            count: count,
            offset: offset,
        });
        return achievement;
    }

    /**
     * Docs: https://api-docs.retroachievements.org/v1/get-game-extended.html
     * 
     * Repo: https://github.com/RetroAchievements/api-js/blob/main/src/game/getGameExtended.ts
     */
    public static async getGameExtended(auth: AuthObject, id: number, unofficialSet: boolean = false): Promise<GameExtended> {
        const game: GameExtended = await getGameExtended(auth, {
            gameId: id,
            isRequestingUnofficialAchievements: unofficialSet
        });
        return game;
    }

    // #region Lists

    /**
     * Docs: https://api-docs.retroachievements.org/v1/get-user-points.html
     * 
     * Repo: https://github.com/RetroAchievements/api-js/blob/main/src/user/getUserPoints.ts
     */
    public static async getAllTimeList(auth: AuthObject, users: Array<string>): Promise<Array<userPoints>> {
        const allTimeList: Array<userPoints> = [];
        for (const user of users) {
            const userPoints: UserPoints = await getUserPoints(auth, {
                username: user,
            });
            allTimeList.push({ username: user, points: userPoints.points });
            await Util.sleep(this.callDelayInMS);
        }
        allTimeList.sort((a: userPoints, b: userPoints) => b.points - a.points);
        return allTimeList;
    }

    /**
     * Docs: https://api-docs.retroachievements.org/v1/get-achievements-earned-on-day.html
     * 
     * Repo: https://github.com/RetroAchievements/api-js/blob/main/src/user/getAchievementsEarnedOnDay.ts
     */
    public static async getDailyList(auth: AuthObject, users: Array<string>, filterZero: boolean = false): Promise<Array<userPoints>> {
        const dailyList: Array<userPoints> = [];
        const nowGMT: number = Date.now() + this.gmtOffsetInMS;
        const onDate: Date = new Date(nowGMT);
        for (const user of users) {
            const userEarnedOnDay: DatedUserAchievement[] = await getAchievementsEarnedOnDay(
                auth, {
                    username: user,
                    onDate: onDate,
            }); // onDate: new Date(new Date().toUTCString()),
            const userPoints: number = (userEarnedOnDay.length > 0) ?
                (userEarnedOnDay.pop()?.cumulScore ?? 0) : 0;
            if (!(filterZero === true && userPoints === 0)) {
                dailyList.push({ username: user, points: userPoints });
            }
            await Util.sleep(this.callDelayInMS);
        }
        dailyList.sort((a: userPoints, b: userPoints) => b.points - a.points);
        return dailyList;
    }

    /**
     * Docs: https://api-docs.retroachievements.org/v1/get-achievements-earned-between.html
     * 
     * Repo: https://github.com/RetroAchievements/api-js/blob/main/src/user/getAchievementsEarnedBetween.ts
     */
    public static async getWeeklyList(auth: AuthObject, users: Array<string>, filterZero: boolean = false): Promise<Array<userPoints>> {
        const getLastMonday = (dateIn: Date): Date => {
            const dateOut: Date = new Date(dateIn);
            dateOut.setDate(dateOut.getDate() - (dateOut.getDay() || 7) + 1);
            return dateOut;
        };
        const weeklyList: Array<userPoints> = [];
        const nowGMT: number = Date.now() + this.gmtOffsetInMS;
        const toDate: Date = new Date(nowGMT);
        const fromDate: Date = new Date(getLastMonday(toDate).toUTCString());
        fromDate.setUTCHours(0, 0, 0, 0);
        for (const user of users) {
            const userEarnedBetween: DatedUserAchievement[] = await getAchievementsEarnedBetween(auth, {
                username: user,
                fromDate: fromDate,
                toDate: toDate,
            });
            const userPoints: number = (userEarnedBetween.length > 0) ?
                (userEarnedBetween.pop()?.cumulScore ?? 0) : 0;
            if (!(filterZero === true && userPoints === 0)) {
                weeklyList.push({ username: user, points: userPoints });
            }
            await Util.sleep(this.callDelayInMS);
        }
        weeklyList.sort((a: userPoints, b: userPoints) => b.points - a.points);
        return weeklyList;
    }

    /**
     * Docs: https://api-docs.retroachievements.org/v1/get-user-recent-achievements.html
     * 
     * Repo: https://github.com/RetroAchievements/api-js/blob/main/src/user/getUserRecentAchievements.ts
     */
    public static async getRecentList(auth: AuthObject, users: Array<string>, minutesToLookBack: number = 60): Promise<Array<retroAchievementData>> {
        // Request normally defaults to 60
        const recentList: retroAchievementData[] = [];
        try {
            for (const user of users) {
                const userEarnedRecent: UserRecentAchievement[] = await getUserRecentAchievements(auth, {
                    username: user,
                    recentMinutes: minutesToLookBack,
                });
                await Util.sleep(this.callDelayInMS);
                for (const achievement of userEarnedRecent) {
                    const unlockData: AchievementUnlocksMetadata = await getAchievementUnlocks(auth, {
                        achievementId: achievement.achievementId,
                        count: 0,
                    });
                    const unlockPercent: string = `${((unlockData.unlocksCount / unlockData.totalPlayers) * 100).toFixed(2)}%`;
                    const systemId: number = unlockData.console.id;
                    await Util.sleep(this.callDelayInMS);
                    recentList.push({ ...achievement, username: user, unlockPercent, systemId });
                }
            }
            recentList.sort((a: retroAchievementData, b: retroAchievementData) => {
                if (a.date > b.date) {
                    return -1;
                } else if (b.date < a.date) {
                    return 1;
                } else {
                    return 0;
                }
            });
            recentList.reverse();
        } catch (error: unknown) {
            const errorStr: string = `An error occurred while fetching user recent achievements: ${(error as string)}`;
            throw new Error(errorStr);
        }
        return recentList;
    }
}