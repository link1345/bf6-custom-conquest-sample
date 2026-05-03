import * as modlib from "modlib";

const TEAM_1_ID = 1;
const TEAM_2_ID = 2;
const NEUTRAL_TEAM_ID = 0;

const CAPTURE_POINT_BASE_ID = 200;
const VEHICLE_SPAWNER_BASE_ID = 600;
const AI_SPAWNER_TEAM_1 = 901;
const AI_SPAWNER_TEAM_2 = 902;

const STARTING_TICKETS = 1500;
const ASSAULT_ATTACKER_TICKETS = 2000;
const ASSAULT_DEFENDER_TICKETS = 1500;
const GAME_MODE_TARGET_SCORE = 10000;
const TIME_LIMIT_SECONDS = 2700;
const LOW_TICKET_MUSIC_THRESHOLD = 100;
const TICKET_BLEED_INTERVAL_SECONDS = 2;
const TOTAL_CONTROL_BONUS = 10;
const FLAG_CAPTURE_TIME_SECONDS = 15;
const FLAG_NEUTRAL_TIME_SECONDS = 20;
const MAX_CUSTOM_AI = 36;
const SCOREBOARD_SORT_COLUMN = 1;

const TEAM_1_TEXT = () => mod.CreateVector(0, 0.8, 1);
const TEAM_1_BG = () => mod.CreateVector(0, 0.2, 0.5);
const TEAM_2_TEXT = () => mod.CreateVector(1, 0.2, 0.2);
const TEAM_2_BG = () => mod.CreateVector(0.6, 0.1, 0.1);
const WHITE = () => mod.CreateVector(1, 1, 1);
const BLACK = () => mod.CreateVector(0, 0, 0);

const FLAG_LETTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
];

const enum PlayerVar {
    Score = 0,
    Kills = 1,
    Deaths = 2,
    Assists = 3,
    Captures = 4,
    Revives = 5,
    OnPoint = 6,
    CurrentCapturePointId = 7,
    LastCaptureProgress = 8,
    CaptureTick = 9,
    OutOfBounds = 10,
    IgnoreOOB = 11,
    AITarget = 12,
    AIInAction = 13,
}

type PlayerState = {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    captures: number;
    revives: number;
    onPoint: boolean;
    currentCapturePointId: number;
    lastCaptureProgress: number;
    captureTick: number;
    outOfBounds: boolean;
    ignoreOOB: boolean;
    aiTarget?: mod.Player;
    aiInAction: boolean;
};

type ConquestState = {
    initialized: boolean;
    gameOngoing: boolean;
    team1Score: number;
    team2Score: number;
    team1StartingScore: number;
    team2StartingScore: number;
    lastTicketBleedTick: number;
    lastHudTick: number;
    lowMusicTriggered: boolean;
    enableCustomAI: boolean;
    enableTeamSwitching: boolean;
    enableVO: boolean;
    enableOOB: boolean;
    enableVehicleSpawns: boolean;
    givePlayersNVG: boolean;
    conquestAssault: boolean;
    lastAITick: number;
    endGameStarted: boolean;
    aiSpawnBlocked: boolean;
};

const state: ConquestState = {
    initialized: false,
    gameOngoing: false,
    team1Score: STARTING_TICKETS,
    team2Score: STARTING_TICKETS,
    team1StartingScore: STARTING_TICKETS,
    team2StartingScore: STARTING_TICKETS,
    lastTicketBleedTick: -1,
    lastHudTick: -1,
    lowMusicTriggered: false,
    enableCustomAI: false,
    enableTeamSwitching: true,
    enableVO: true,
    enableOOB: true,
    enableVehicleSpawns: true,
    givePlayersNVG: false,
    conquestAssault: false,
    lastAITick: -1,
    endGameStarted: false,
    aiSpawnBlocked: false,
};

const playerStates = new Map<number, PlayerState>();

function defaultPlayerState(): PlayerState {
    return {
        score: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        captures: 0,
        revives: 0,
        onPoint: false,
        currentCapturePointId: -1,
        lastCaptureProgress: 0,
        captureTick: 0,
        outOfBounds: false,
        ignoreOOB: false,
        aiInAction: false,
    };
}

function playerState(player: mod.Player): PlayerState {
    const id = mod.GetObjId(player);
    let current = playerStates.get(id);
    if (current === undefined) {
        current = defaultPlayerState();
        playerStates.set(id, current);
    }
    return current;
}

function team(id: number): mod.Team {
    return mod.GetTeam(id);
}

function teamId(teamValue: mod.Team): number {
    return mod.GetObjId(teamValue);
}

function otherTeamId(id: number): number {
    return id === TEAM_1_ID ? TEAM_2_ID : TEAM_1_ID;
}

function otherTeam(teamValue: mod.Team): mod.Team {
    return team(otherTeamId(teamId(teamValue)));
}

function getTeamScore(teamValue: mod.Team): number {
    return teamId(teamValue) === TEAM_1_ID ? state.team1Score : state.team2Score;
}

function setTeamScore(teamValue: mod.Team, score: number): void {
    const clamped = Math.max(0, Math.floor(score));
    if (teamId(teamValue) === TEAM_1_ID) {
        state.team1Score = clamped;
    } else {
        state.team2Score = clamped;
    }
    mod.SetGameModeScore(teamValue, clamped);
}

function addTeamScore(teamValue: mod.Team, delta: number): void {
    setTeamScore(teamValue, getTeamScore(teamValue) + delta);
}

function getStartingScore(teamValue: mod.Team): number {
    return teamId(teamValue) === TEAM_1_ID ? state.team1StartingScore : state.team2StartingScore;
}

function widgetName(parts: Array<string | number | mod.Player | mod.Team | mod.CapturePoint>): string {
    return parts.map((part) => (typeof part === "string" || typeof part === "number" ? part : String(mod.GetObjId(part)))).join("_");
}

function find(name: string, root?: mod.UIWidget): mod.UIWidget {
    return root === undefined ? mod.FindUIWidgetWithName(name) : mod.FindUIWidgetWithName(name, root);
}

function message(
    value: string | number,
    arg0?: string | number | mod.Player,
    arg1?: string | number | mod.Player,
    arg2?: string | number | mod.Player,
): mod.Message {
    if (arg2 !== undefined && arg0 !== undefined && arg1 !== undefined) return mod.Message(value, arg0, arg1, arg2);
    if (arg1 !== undefined && arg0 !== undefined) return mod.Message(value, arg0, arg1);
    if (arg0 !== undefined) return mod.Message(value, arg0);
    return mod.Message(value);
}

function addText(
    name: string,
    position: mod.Vector,
    size: mod.Vector,
    parent: mod.UIWidget,
    msg: mod.Message,
    textSize: number,
    textColor: mod.Vector,
    bgColor: mod.Vector,
    bgAlpha: number,
    bgFill: mod.UIBgFill,
    receiver?: mod.Player | mod.Team,
): void {
    if (receiver === undefined) {
        mod.AddUIText(
            name,
            position,
            size,
            mod.UIAnchor.TopCenter,
            parent,
            true,
            0,
            bgColor,
            bgAlpha,
            bgFill,
            msg,
            textSize,
            textColor,
            1,
            mod.UIAnchor.Center,
        );
        return;
    }

    mod.AddUIText(
        name,
        position,
        size,
        mod.UIAnchor.TopCenter,
        parent,
        true,
        0,
        bgColor,
        bgAlpha,
        bgFill,
        msg,
        textSize,
        textColor,
        1,
        mod.UIAnchor.Center,
        receiver,
    );
}

function addContainer(
    name: string,
    position: mod.Vector,
    size: mod.Vector,
    parent: mod.UIWidget,
    color: mod.Vector,
    alpha: number,
    fill: mod.UIBgFill,
    receiver?: mod.Player | mod.Team,
): void {
    if (receiver === undefined) {
        mod.AddUIContainer(name, position, size, mod.UIAnchor.TopCenter, parent, true, 0, color, alpha, fill);
        return;
    }

    mod.AddUIContainer(name, position, size, mod.UIAnchor.TopCenter, parent, true, 0, color, alpha, fill, receiver);
}

function countPortalArray(array: mod.Array): number {
    return modlib.ConvertArray(array).length;
}

function portalArrayValue<T>(array: mod.Array, index: number): T {
    return modlib.ConvertArray(array)[index] as T;
}

function countOwnedCapturePoints(owner: mod.Team): number {
    const points = mod.AllCapturePoints();
    let owned = 0;

    for (let i = 0; i < countPortalArray(points); i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        if (mod.Equals(mod.GetCurrentOwnerTeam(point), owner)) owned += 1;
    }

    return owned;
}

function countPlayersOnPoint(point: mod.CapturePoint, owner: mod.Team): number {
    const players = mod.GetPlayersOnPoint(point);
    let count = 0;

    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (mod.IsPlayerValid(player) && mod.Equals(mod.GetTeam(player), owner)) count += 1;
    }

    return count;
}

function flagIndex(point: mod.CapturePoint): number {
    return mod.GetObjId(point) - CAPTURE_POINT_BASE_ID;
}

function flagLetter(point: mod.CapturePoint): string {
    const index = flagIndex(point);
    return FLAG_LETTERS[index] ?? String(index + 1);
}

function playerScore(player: mod.Player, slot: PlayerVar): number {
    const current = playerState(player);
    switch (slot) {
        case PlayerVar.Kills:
            return current.kills;
        case PlayerVar.Deaths:
            return current.deaths;
        case PlayerVar.Assists:
            return current.assists;
        case PlayerVar.Captures:
            return current.captures;
        case PlayerVar.Revives:
            return current.revives;
        default:
            return current.score;
    }
}

function addPlayerSlot(player: mod.Player, slot: PlayerVar): void {
    const current = playerState(player);
    switch (slot) {
        case PlayerVar.Kills:
            current.kills += 1;
            break;
        case PlayerVar.Deaths:
            current.deaths += 1;
            break;
        case PlayerVar.Assists:
            current.assists += 1;
            break;
        case PlayerVar.Captures:
            current.captures += 1;
            break;
        case PlayerVar.Revives:
            current.revives += 1;
            break;
        default:
            break;
    }
}

function addPlayerScore(player: mod.Player, scoreDelta: number, slot?: PlayerVar): void {
    const current = playerState(player);
    current.score += scoreDelta;
    if (slot !== undefined) addPlayerSlot(player, slot);
    updatePlayerScoreboard(player);
}

function initializePlayerState(player: mod.Player): void {
    const current = playerState(player);
    current.onPoint = false;
    current.currentCapturePointId = -1;
    current.lastCaptureProgress = 0;
    current.captureTick = 0;
    current.outOfBounds = false;
    current.ignoreOOB = false;
    current.aiTarget = undefined;
    current.aiInAction = false;
}

function setupScoreboard(): void {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardColumnNames(
        message("Score"),
        message("Kills"),
        message("Deaths"),
        message("Assists"),
        message("Captures"),
    );
    mod.SetScoreboardColumnWidths(2, 1, 1, 1, 1);
    mod.SetScoreboardSorting(SCOREBOARD_SORT_COLUMN, true);
    updateScoreboardHeader();
}

function updateScoreboardHeader(): void {
    mod.SetScoreboardHeader(message("{}: {}", "Team 1", getTeamScore(team(TEAM_1_ID))), message("{}: {}", "Team 2", getTeamScore(team(TEAM_2_ID))));
}

function updatePlayerScoreboard(player: mod.Player): void {
    mod.SetScoreboardPlayerValues(
        player,
        playerScore(player, PlayerVar.Score),
        playerScore(player, PlayerVar.Kills),
        playerScore(player, PlayerVar.Deaths),
        playerScore(player, PlayerVar.Assists),
        playerScore(player, PlayerVar.Captures),
    );
}

function scoreRootName(teamValue: mod.Team): string {
    return widgetName(["ConquestHUD", teamValue, "Root"]);
}

function createTeamHud(teamValue: mod.Team): void {
    const rootName = scoreRootName(teamValue);
    if (mod.HasUIWidgetWithName(rootName)) mod.DeleteUIWidget(find(rootName));

    mod.AddUIContainer(rootName, mod.CreateVector(0, 0, 0), mod.CreateVector(2000, 2000, 0), mod.UIAnchor.TopCenter, teamValue);
    const root = find(rootName);
    mod.SetUIWidgetBgFill(root, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    addText("ConquestTimer", mod.CreateVector(0, 50, 0), mod.CreateVector(90, 30, 0), root, timeMessage(), 24, WHITE(), BLACK(), 0.8, mod.UIBgFill.Blur, teamValue);
    addText(
        widgetName(["ConquestScore", teamValue, "Friendly"]),
        mod.CreateVector(-315, 45, 0),
        mod.CreateVector(86, 40, 0),
        root,
        message("{}", getTeamScore(teamValue)),
        32,
        TEAM_1_TEXT(),
        TEAM_1_BG(),
        0.8,
        mod.UIBgFill.Blur,
        teamValue,
    );
    addText(
        widgetName(["ConquestScore", teamValue, "Enemy"]),
        mod.CreateVector(315, 45, 0),
        mod.CreateVector(86, 40, 0),
        root,
        message("{}", getTeamScore(otherTeam(teamValue))),
        32,
        TEAM_2_TEXT(),
        TEAM_2_BG(),
        0.8,
        mod.UIBgFill.Blur,
        teamValue,
    );
    addContainer(widgetName(["ConquestBarBg", teamValue, "Friendly"]), mod.CreateVector(-160, 60, 0), mod.CreateVector(200, 10, 0), root, TEAM_1_BG(), 0.8, mod.UIBgFill.Blur, teamValue);
    addContainer(widgetName(["ConquestBarBg", teamValue, "Enemy"]), mod.CreateVector(160, 60, 0), mod.CreateVector(200, 10, 0), root, TEAM_2_BG(), 0.8, mod.UIBgFill.Blur, teamValue);
    addContainer(widgetName(["ConquestBar", teamValue, "Friendly"]), mod.CreateVector(-260, 60, 0), mod.CreateVector(200, 10, 0), root, TEAM_1_TEXT(), 1, mod.UIBgFill.Solid, teamValue);
    addContainer(widgetName(["ConquestBar", teamValue, "Enemy"]), mod.CreateVector(260, 60, 0), mod.CreateVector(200, 10, 0), root, TEAM_2_TEXT(), 1, mod.UIBgFill.Solid, teamValue);
    createObjectiveHud(teamValue, root);
    updateTeamHud(teamValue);
}

function createObjectiveHud(teamValue: mod.Team, root: mod.UIWidget): void {
    const points = mod.AllCapturePoints();
    const total = Math.max(1, countPortalArray(points));

    for (let i = 0; i < total; i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        const x = (i - (total - 1) / 2) * 50;
        addText(
            objectiveWidgetName(teamValue, point, "Text"),
            mod.CreateVector(x, 90, 0),
            mod.CreateVector(30, 30, 0),
            root,
            message(flagLetter(point)),
            24,
            objectiveTextColorForTeam(teamValue, point),
            objectiveBgColorForTeam(teamValue, point),
            0.8,
            mod.UIBgFill.Blur,
            teamValue,
        );
        addContainer(
            objectiveWidgetName(teamValue, point, "Progress"),
            mod.CreateVector(x, 122, 0),
            mod.CreateVector(30, 5, 0),
            root,
            objectiveTextColorForTeam(teamValue, point),
            1,
            mod.UIBgFill.Solid,
            teamValue,
        );
    }
}

function objectiveWidgetName(teamValue: mod.Team, point: mod.CapturePoint, suffix: string): string {
    return widgetName(["ConquestObjective", teamValue, point, suffix]);
}

function objectiveTextColorForTeam(teamValue: mod.Team, point: mod.CapturePoint): mod.Vector {
    const owner = mod.GetCurrentOwnerTeam(point);
    if (mod.Equals(owner, teamValue)) return TEAM_1_TEXT();
    if (teamId(owner) === NEUTRAL_TEAM_ID) return WHITE();
    return TEAM_2_TEXT();
}

function objectiveBgColorForTeam(teamValue: mod.Team, point: mod.CapturePoint): mod.Vector {
    const owner = mod.GetCurrentOwnerTeam(point);
    if (mod.Equals(owner, teamValue)) return TEAM_1_BG();
    if (teamId(owner) === NEUTRAL_TEAM_ID) return BLACK();
    return TEAM_2_BG();
}

function updateTeamHud(teamValue: mod.Team): void {
    const friendly = getTeamScore(teamValue);
    const enemy = getTeamScore(otherTeam(teamValue));
    const friendlyStart = getStartingScore(teamValue);
    const enemyStart = getStartingScore(otherTeam(teamValue));
    const friendlyWidth = ticketBarWidth(friendly, friendlyStart);
    const enemyWidth = ticketBarWidth(enemy, enemyStart);

    setTextIfPresent(widgetName(["ConquestScore", teamValue, "Friendly"]), message("{}", friendly));
    setTextIfPresent(widgetName(["ConquestScore", teamValue, "Enemy"]), message("{}", enemy));
    setTextIfPresent("ConquestTimer", timeMessage(), find(scoreRootName(teamValue)));
    setSizeAndPositionIfPresent(widgetName(["ConquestBar", teamValue, "Friendly"]), mod.CreateVector(friendlyWidth, 10, 0), mod.CreateVector(-260 + friendlyWidth / 2, 60, 0));
    setSizeAndPositionIfPresent(widgetName(["ConquestBar", teamValue, "Enemy"]), mod.CreateVector(enemyWidth, 10, 0), mod.CreateVector(260 - enemyWidth / 2, 60, 0));
    updateObjectiveHud(teamValue);
}

function updateObjectiveHud(teamValue: mod.Team): void {
    const points = mod.AllCapturePoints();
    const total = Math.max(1, countPortalArray(points));

    for (let i = 0; i < total; i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        const x = (i - (total - 1) / 2) * 50;
        setTextIfPresent(objectiveWidgetName(teamValue, point, "Text"), message(flagLetter(point)));
        setWidgetColorIfPresent(objectiveWidgetName(teamValue, point, "Text"), objectiveBgColorForTeam(teamValue, point));
        setTextColorIfPresent(objectiveWidgetName(teamValue, point, "Text"), objectiveTextColorForTeam(teamValue, point));
        setWidgetColorIfPresent(objectiveWidgetName(teamValue, point, "Progress"), objectiveTextColorForTeam(teamValue, point));
        setSizeAndPositionIfPresent(
            objectiveWidgetName(teamValue, point, "Progress"),
            mod.CreateVector(Math.max(2, Math.floor(30 * mod.GetCaptureProgress(point))), 5, 0),
            mod.CreateVector(x, 122, 0),
        );
    }
}

function setTextIfPresent(name: string, msg: mod.Message, root?: mod.UIWidget): void {
    if (root === undefined ? mod.HasUIWidgetWithName(name) : mod.HasUIWidgetWithName(name, root)) {
        mod.SetUITextLabel(find(name, root), msg);
    }
}

function setTextColorIfPresent(name: string, color: mod.Vector): void {
    if (mod.HasUIWidgetWithName(name)) mod.SetUITextColor(find(name), color);
}

function setWidgetColorIfPresent(name: string, color: mod.Vector): void {
    if (mod.HasUIWidgetWithName(name)) mod.SetUIWidgetBgColor(find(name), color);
}

function setSizeAndPositionIfPresent(name: string, size: mod.Vector, position: mod.Vector): void {
    if (!mod.HasUIWidgetWithName(name)) return;
    const widget = find(name);
    mod.SetUIWidgetSize(widget, size);
    mod.SetUIWidgetPosition(widget, position);
}

function ticketBarWidth(score: number, startingScore: number): number {
    if (startingScore <= 0) return 0;
    return Math.max(0, Math.min(200, Math.floor(200 * (score / startingScore))));
}

function timeMessage(): mod.Message {
    const remaining = Math.max(0, Math.floor(mod.GetMatchTimeRemaining()));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const tens = Math.floor(seconds / 10);
    const ones = seconds % 10;
    return message("{} : {}{}", minutes, tens, ones);
}

function updateAllHud(): void {
    updateScoreboardHeader();
    updateTeamHud(team(TEAM_1_ID));
    updateTeamHud(team(TEAM_2_ID));
}

function setupCapturePoint(point: mod.CapturePoint): void {
    mod.SetCapturePointCapturingTime(point, FLAG_CAPTURE_TIME_SECONDS);
    mod.SetCapturePointNeutralizationTime(point, FLAG_NEUTRAL_TIME_SECONDS);
    mod.SetMaxCaptureMultiplier(point, 3);
    mod.EnableGameModeObjective(point, true);
    mod.EnableCapturePointDeploying(point, true);
}

function setupAllCapturePoints(): void {
    const points = mod.AllCapturePoints();
    for (let i = 0; i < countPortalArray(points); i += 1) setupCapturePoint(portalArrayValue<mod.CapturePoint>(points, i));
}

function initializeConquestState(): void {
    playerStates.clear();
    state.initialized = true;
    state.gameOngoing = false;
    state.enableCustomAI = false;
    state.enableTeamSwitching = true;
    state.enableVO = true;
    state.enableOOB = true;
    state.enableVehicleSpawns = true;
    state.givePlayersNVG = false;
    state.conquestAssault = false;
    state.lastTicketBleedTick = -1;
    state.lastHudTick = -1;
    state.lastAITick = -1;
    state.lowMusicTriggered = false;
    state.endGameStarted = false;
    state.aiSpawnBlocked = false;

    if (state.conquestAssault) {
        state.team1StartingScore = ASSAULT_ATTACKER_TICKETS;
        state.team2StartingScore = ASSAULT_DEFENDER_TICKETS;
    } else {
        state.team1StartingScore = STARTING_TICKETS;
        state.team2StartingScore = STARTING_TICKETS;
    }

    setTeamScore(team(TEAM_1_ID), getStartingScore(team(TEAM_1_ID)));
    setTeamScore(team(TEAM_2_ID), getStartingScore(team(TEAM_2_ID)));
}

function startConquest(): void {
    mod.SetGameModeTimeLimit(TIME_LIMIT_SECONDS);
    mod.SetGameModeTargetScore(GAME_MODE_TARGET_SCORE);
    mod.SetVehicleCategoryAllowedInSurroundingArea(mod.VehicleCategories.Air_All, true);
    mod.SetUnspawnDelayInSeconds(mod.GetSpawner(AI_SPAWNER_TEAM_1), 300);
    mod.SetUnspawnDelayInSeconds(mod.GetSpawner(AI_SPAWNER_TEAM_2), 300);
    setupScoreboard();
    setupAllCapturePoints();
    createTeamHud(team(TEAM_1_ID));
    createTeamHud(team(TEAM_2_ID));
    mod.LoadMusic(mod.MusicPackages.Core);
    mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
    state.gameOngoing = true;
}

function bleedTickets(): void {
    const team1Owned = countOwnedCapturePoints(team(TEAM_1_ID));
    const team2Owned = countOwnedCapturePoints(team(TEAM_2_ID));

    if (team1Owned > 0 && team2Owned === 0) addTeamScore(team(TEAM_2_ID), -TOTAL_CONTROL_BONUS);
    if (team2Owned > 0 && team1Owned === 0) addTeamScore(team(TEAM_1_ID), -TOTAL_CONTROL_BONUS);

    if (team1Owned > team2Owned) {
        addTeamScore(team(TEAM_2_ID), -(team1Owned - team2Owned));
        flashBleedingTeam(team(TEAM_2_ID));
    } else if (team2Owned > team1Owned) {
        addTeamScore(team(TEAM_1_ID), -(team2Owned - team1Owned));
        flashBleedingTeam(team(TEAM_1_ID));
    }
}

function flashBleedingTeam(bleedingTeam: mod.Team): void {
    const teamOneRoot = find(scoreRootName(team(TEAM_1_ID)));
    const teamTwoRoot = find(scoreRootName(team(TEAM_2_ID)));
    const name = widgetName(["ConquestBleedFlash", bleedingTeam, mod.GetMatchTimeElapsed()]);
    addContainer(name, mod.CreateVector(0, 130, 0), mod.CreateVector(260, 8, 0), teamOneRoot, TEAM_2_TEXT(), 0.65, mod.UIBgFill.Solid, team(TEAM_1_ID));
    addContainer(`${name}_2`, mod.CreateVector(0, 130, 0), mod.CreateVector(260, 8, 0), teamTwoRoot, TEAM_2_TEXT(), 0.65, mod.UIBgFill.Solid, team(TEAM_2_ID));
}

function maybeBleedTickets(): void {
    if (!state.gameOngoing) return;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed());
    const currentTick = Math.floor(elapsed / TICKET_BLEED_INTERVAL_SECONDS);
    if (currentTick === state.lastTicketBleedTick) return;

    state.lastTicketBleedTick = currentTick;
    bleedTickets();
    maybeTriggerLowTicketMusic();
    updateAllHud();
    checkEndGame();
}

function maybeRefreshHud(): void {
    if (!state.gameOngoing) return;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed());
    if (elapsed === state.lastHudTick) return;
    state.lastHudTick = elapsed;
    updateAllHud();
}

function maybeTriggerLowTicketMusic(): void {
    if (state.lowMusicTriggered) return;
    if (getTeamScore(team(TEAM_1_ID)) > LOW_TICKET_MUSIC_THRESHOLD && getTeamScore(team(TEAM_2_ID)) > LOW_TICKET_MUSIC_THRESHOLD) return;

    state.lowMusicTriggered = true;
    mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop);
}

function checkEndGame(): void {
    if (!state.gameOngoing || state.endGameStarted) return;
    if (mod.GetMatchTimeRemaining() > 1 && getTeamScore(team(TEAM_1_ID)) > 0 && getTeamScore(team(TEAM_2_ID)) > 0) return;
    endConquest();
}

function endConquest(): void {
    state.endGameStarted = true;
    state.gameOngoing = false;
    mod.PauseGameModeTime(true);
    setTeamScore(team(TEAM_1_ID), getTeamScore(team(TEAM_1_ID)));
    setTeamScore(team(TEAM_2_ID), getTeamScore(team(TEAM_2_ID)));
    updateAllHud();
    mod.PlayMusic(mod.MusicEvents.Core_EndOfRound_Loop);

    const team1Score = getTeamScore(team(TEAM_1_ID));
    const team2Score = getTeamScore(team(TEAM_2_ID));
    if (team1Score > team2Score) {
        mod.SetMusicParam(mod.MusicParams.Core_IsWinning, 1, team(TEAM_1_ID));
        mod.EndGameMode(team(TEAM_1_ID));
    } else if (team2Score > team1Score) {
        mod.SetMusicParam(mod.MusicParams.Core_IsWinning, 1, team(TEAM_2_ID));
        mod.EndGameMode(team(TEAM_2_ID));
    } else {
        mod.EndGameMode(team(NEUTRAL_TEAM_ID));
    }
}

function updateVehicleSpawnerForPoint(point: mod.CapturePoint): void {
    if (!state.enableVehicleSpawns) return;

    const index = flagIndex(point);
    if (index < 0) return;

    const team1Spawner = mod.GetVehicleSpawner(VEHICLE_SPAWNER_BASE_ID + index * 10);
    const team2Spawner = mod.GetVehicleSpawner(VEHICLE_SPAWNER_BASE_ID + index * 10 + 1);
    const owner = mod.GetCurrentOwnerTeam(point);
    mod.SetVehicleSpawnerAutoSpawn(team1Spawner, mod.Equals(owner, team(TEAM_1_ID)));
    mod.SetVehicleSpawnerAutoSpawn(team2Spawner, mod.Equals(owner, team(TEAM_2_ID)));
}

function awardCapturePlayers(point: mod.CapturePoint): void {
    const owner = mod.GetCurrentOwnerTeam(point);
    const players = mod.GetPlayersOnPoint(point);

    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (!mod.IsPlayerValid(player) || !mod.Equals(mod.GetTeam(player), owner)) continue;
        addPlayerScore(player, 50, PlayerVar.Captures);
    }
}

function playCaptureVO(point: mod.CapturePoint): void {
    if (!state.enableVO) return;
    const owner = mod.GetCurrentOwnerTeam(point);
    mod.PlayVO(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)), mod.VoiceOverEvents2D.ObjectiveCaptured, voiceOverFlag(point), owner);
}

function voiceOverFlag(point: mod.CapturePoint): mod.VoiceOverFlags {
    const flags = [
        mod.VoiceOverFlags.Alpha,
        mod.VoiceOverFlags.Bravo,
        mod.VoiceOverFlags.Charlie,
        mod.VoiceOverFlags.Delta,
        mod.VoiceOverFlags.Echo,
        mod.VoiceOverFlags.Foxtrot,
        mod.VoiceOverFlags.Golf,
        mod.VoiceOverFlags.Hotel,
        mod.VoiceOverFlags.India,
    ];
    return flags[Math.max(0, Math.min(flags.length - 1, flagIndex(point)))] ?? mod.VoiceOverFlags.Alpha;
}

function createPlayerHud(player: mod.Player): void {
    const rootName = widgetName(["ConquestPlayerHUD", player]);
    if (mod.HasUIWidgetWithName(rootName)) mod.DeleteUIWidget(find(rootName));

    mod.AddUIContainer(rootName, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.TopCenter, player);
    const root = find(rootName);
    mod.SetUIWidgetBgFill(root, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

    addText(widgetName([rootName, "ObjectiveText"]), mod.CreateVector(0, 150, 0), mod.CreateVector(230, 40, 0), root, message(""), 34, WHITE(), BLACK(), 0.8, mod.UIBgFill.Blur, player);
    addText(widgetName([rootName, "ObjectiveCount"]), mod.CreateVector(0, 210, 0), mod.CreateVector(230, 40, 0), root, message(""), 28, WHITE(), BLACK(), 0, mod.UIBgFill.None, player);
    addContainer(widgetName([rootName, "ObjectiveProgressBg"]), mod.CreateVector(0, 200, 0), mod.CreateVector(220, 7, 0), root, BLACK(), 0.8, mod.UIBgFill.Blur, player);
    addContainer(widgetName([rootName, "ObjectiveProgress"]), mod.CreateVector(-110, 200, 0), mod.CreateVector(2, 7, 0), root, WHITE(), 1, mod.UIBgFill.Solid, player);
    addText(widgetName([rootName, "OOBShade"]), mod.CreateVector(0, 0, 0), mod.CreateVector(5000, 5000, 0), root, message(""), 24, BLACK(), BLACK(), 0.9, mod.UIBgFill.Blur, player);
    addText(widgetName([rootName, "OOBText"]), mod.CreateVector(0, 470, 0), mod.CreateVector(420, 150, 0), root, message("Return To Combat"), 56, TEAM_2_TEXT(), TEAM_2_BG(), 0.8, mod.UIBgFill.Blur, player);
    setPlayerObjectiveVisible(player, false);
    setPlayerOobVisible(player, false);
}

function playerHudWidget(player: mod.Player, suffix: string): string {
    return widgetName(["ConquestPlayerHUD", player, suffix]);
}

function setPlayerObjectiveVisible(player: mod.Player, visible: boolean): void {
    for (const suffix of ["ObjectiveText", "ObjectiveCount", "ObjectiveProgressBg", "ObjectiveProgress"]) {
        const name = playerHudWidget(player, suffix);
        if (mod.HasUIWidgetWithName(name)) mod.SetUIWidgetVisible(find(name), visible);
    }
}

function setPlayerOobVisible(player: mod.Player, visible: boolean): void {
    for (const suffix of ["OOBShade", "OOBText"]) {
        const name = playerHudWidget(player, suffix);
        if (mod.HasUIWidgetWithName(name)) mod.SetUIWidgetVisible(find(name), visible);
    }
}

function updatePlayerCaptureHud(player: mod.Player, point: mod.CapturePoint): void {
    const progress = mod.GetCaptureProgress(point);
    const width = Math.max(2, Math.floor(220 * progress));
    const rootName = widgetName(["ConquestPlayerHUD", player]);
    const friendlyCount = countPlayersOnPoint(point, mod.GetTeam(player));
    const enemyCount = countPlayersOnPoint(point, otherTeam(mod.GetTeam(player)));
    const owner = mod.GetCurrentOwnerTeam(point);
    const ownerProgressTeam = mod.GetOwnerProgressTeam(point);
    const playerIsProgressOwner = mod.Equals(ownerProgressTeam, mod.GetTeam(player));
    const textColor = mod.Equals(owner, mod.GetTeam(player)) ? TEAM_1_TEXT() : teamId(owner) === NEUTRAL_TEAM_ID ? WHITE() : TEAM_2_TEXT();
    const label = captureStatusLabel(player, point);

    setTextIfPresent(widgetName([rootName, "ObjectiveText"]), message(label));
    setTextIfPresent(widgetName([rootName, "ObjectiveCount"]), message("{} - {}", friendlyCount, enemyCount));
    setTextColorIfPresent(widgetName([rootName, "ObjectiveText"]), textColor);
    setWidgetColorIfPresent(widgetName([rootName, "ObjectiveProgress"]), playerIsProgressOwner ? TEAM_1_TEXT() : TEAM_2_TEXT());
    setSizeAndPositionIfPresent(widgetName([rootName, "ObjectiveProgress"]), mod.CreateVector(width, 7, 0), mod.CreateVector(-110 + width / 2, 200, 0));
    playerState(player).lastCaptureProgress = progress;
}

function captureStatusLabel(player: mod.Player, point: mod.CapturePoint): string {
    const owner = mod.GetCurrentOwnerTeam(point);
    const progress = mod.GetCaptureProgress(point);
    if (progress >= 1 && mod.Equals(owner, mod.GetTeam(player))) return "SECURED";
    if (progress >= 1) return "CONTESTED";
    const progressTeam = mod.GetOwnerProgressTeam(point);
    if (mod.Equals(progressTeam, mod.GetTeam(player))) return "CAPTURING";
    if (teamId(progressTeam) === NEUTRAL_TEAM_ID) return "CONTESTED";
    return "LOSING";
}

function maybeRunAI(): void {
    if (!state.enableCustomAI || state.aiSpawnBlocked) return;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed());
    if (elapsed === state.lastAITick) return;
    state.lastAITick = elapsed;

    const allPlayers = mod.AllPlayers();
    const aiCount = countAIPlayers(allPlayers);
    if (aiCount >= MAX_CUSTOM_AI) return;

    try {
        if (countTeamPlayers(allPlayers, team(TEAM_1_ID)) <= countTeamPlayers(allPlayers, team(TEAM_2_ID))) {
            mod.SpawnAIFromAISpawner(mod.GetSpawner(AI_SPAWNER_TEAM_1), team(TEAM_1_ID));
        } else {
            mod.SpawnAIFromAISpawner(mod.GetSpawner(AI_SPAWNER_TEAM_2), team(TEAM_2_ID));
        }
    } catch (_error) {
        void _error;
        state.aiSpawnBlocked = true;
    }
}

function countAIPlayers(players: mod.Array): number {
    let count = 0;
    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (mod.IsPlayerValid(player) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) count += 1;
    }
    return count;
}

function countTeamPlayers(players: mod.Array, teamValue: mod.Team): number {
    let count = 0;
    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (mod.IsPlayerValid(player) && mod.Equals(mod.GetTeam(player), teamValue)) count += 1;
    }
    return count;
}

function chooseNearestObjective(player: mod.Player): mod.CapturePoint {
    const points = mod.AllCapturePoints();
    let selected = portalArrayValue<mod.CapturePoint>(points, 0);
    let selectedDistance = mod.DistanceBetween(mod.GetObjectPosition(player), mod.GetObjectPosition(selected));

    for (let i = 1; i < countPortalArray(points); i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        const owner = mod.GetCurrentOwnerTeam(point);
        const distance = mod.DistanceBetween(mod.GetObjectPosition(player), mod.GetObjectPosition(point));
        const isEnemyOrNeutral = !mod.Equals(owner, mod.GetTeam(player));
        if (isEnemyOrNeutral && distance < selectedDistance) {
            selected = point;
            selectedDistance = distance;
        }
    }

    return selected;
}

function sendAIToObjective(player: mod.Player): void {
    if (!mod.IsPlayerValid(player) || !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;
    const objective = chooseNearestObjective(player);
    mod.AISetMoveSpeed(player, mod.MoveSpeed.InvestigateRun);
    mod.AIMoveToBehavior(player, mod.GetObjectPosition(objective));
}

function checkConquestAssaultWin(): void {
    if (!state.conquestAssault) return;
    if (countOwnedCapturePoints(team(TEAM_2_ID)) > 0) return;
    setTeamScore(team(TEAM_2_ID), 0);
    checkEndGame();
}

export function OngoingGlobal(): void {
    if (!state.initialized) initializeConquestState();
    maybeRefreshHud();
    maybeBleedTickets();
    maybeRunAI();
    checkConquestAssaultWin();
    checkEndGame();
}

export function OnGameModeStarted(): void {
    initializeConquestState();
    startConquest();
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    initializePlayerState(eventPlayer);
    createPlayerHud(eventPlayer);
    updatePlayerScoreboard(eventPlayer);
    if (state.gameOngoing) updateAllHud();
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const current = playerState(eventPlayer);
    current.onPoint = false;
    current.outOfBounds = false;
    if (state.givePlayersNVG) mod.AddEquipment(eventPlayer, mod.Gadgets.Mask_NVG);
    sendAIToObjective(eventPlayer);
}

export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, _eventDeathType: mod.DeathType, _eventWeaponUnlock: mod.WeaponUnlock): void {
    void _eventDeathType;
    void _eventWeaponUnlock;
    if (!state.gameOngoing) return;
    addPlayerScore(eventPlayer, 0, PlayerVar.Deaths);
    addTeamScore(mod.GetTeam(eventPlayer), -1);
    if (mod.IsPlayerValid(eventOtherPlayer)) playerState(eventPlayer).aiTarget = eventOtherPlayer;
    updateAllHud();
    checkEndGame();
}

export function OnPlayerEarnedKill(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, _eventDeathType: mod.DeathType, _eventWeaponUnlock: mod.WeaponUnlock): void {
    void _eventDeathType;
    void _eventWeaponUnlock;
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(eventOtherPlayer))) return;
    addPlayerScore(eventPlayer, 20, PlayerVar.Kills);
}

export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(eventOtherPlayer))) return;
    addPlayerScore(eventPlayer, 10, PlayerVar.Assists);
}

export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    if (!mod.IsPlayerValid(eventOtherPlayer)) return;
    addPlayerScore(eventOtherPlayer, 20, PlayerVar.Revives);
    updatePlayerScoreboard(eventPlayer);
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    awardCapturePlayers(eventCapturePoint);
    updateVehicleSpawnerForPoint(eventCapturePoint);
    playCaptureVO(eventCapturePoint);
    updateAllHud();
    checkConquestAssaultWin();
}

export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint): void {
    if (!state.enableVO) return;
    mod.PlayVO(mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)), mod.VoiceOverEvents2D.ObjectiveCapturing, voiceOverFlag(eventCapturePoint), mod.GetOwnerProgressTeam(eventCapturePoint));
}

export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    const players = mod.GetPlayersOnPoint(eventCapturePoint);
    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (mod.IsPlayerValid(player)) updatePlayerCaptureHud(player, eventCapturePoint);
    }
    updateObjectiveHud(team(TEAM_1_ID));
    updateObjectiveHud(team(TEAM_2_ID));
}

export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    const current = playerState(eventPlayer);
    current.onPoint = true;
    current.currentCapturePointId = mod.GetObjId(eventCapturePoint);
    current.lastCaptureProgress = mod.GetCaptureProgress(eventCapturePoint);
    setPlayerObjectiveVisible(eventPlayer, true);
    updatePlayerCaptureHud(eventPlayer, eventCapturePoint);
    sendAIToObjective(eventPlayer);
}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, _eventCapturePoint: mod.CapturePoint): void {
    void _eventCapturePoint;
    const current = playerState(eventPlayer);
    current.onPoint = false;
    current.currentCapturePointId = -1;
    current.captureTick = 0;
    setPlayerObjectiveVisible(eventPlayer, false);
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {
    if (!state.enableTeamSwitching) return;
    const id = mod.GetObjId(eventInteractPoint);
    if (id === TEAM_1_ID) mod.SetTeam(eventPlayer, team(TEAM_1_ID));
    if (id === TEAM_2_ID) mod.SetTeam(eventPlayer, team(TEAM_2_ID));
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, _eventAreaTrigger: mod.AreaTrigger): void {
    void _eventAreaTrigger;
    const current = playerState(eventPlayer);
    if (!state.enableOOB || current.ignoreOOB) return;
    current.outOfBounds = true;
    setPlayerOobVisible(eventPlayer, true);
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, _eventAreaTrigger: mod.AreaTrigger): void {
    void _eventAreaTrigger;
    playerState(eventPlayer).outOfBounds = false;
    setPlayerOobVisible(eventPlayer, false);
}

export function OnPlayerDamaged(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, _eventDamageType: mod.DamageType, _eventWeaponUnlock: mod.WeaponUnlock): void {
    void _eventDamageType;
    void _eventWeaponUnlock;
    if (!mod.IsPlayerValid(eventPlayer) || !mod.IsPlayerValid(eventOtherPlayer)) return;
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier) && !mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(eventOtherPlayer))) {
        playerState(eventPlayer).aiTarget = eventOtherPlayer;
        mod.AISetTarget(eventPlayer, eventOtherPlayer);
    }
}

export function OnPlayerEnterVehicle(eventPlayer: mod.Player, _eventVehicle: mod.Vehicle): void {
    void _eventVehicle;
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) mod.AIBattlefieldBehavior(eventPlayer);
}

export function OnPlayerExitVehicle(eventPlayer: mod.Player, _eventVehicle: mod.Vehicle): void {
    void _eventVehicle;
    sendAIToObjective(eventPlayer);
}

export function OnAIMoveToFailed(eventPlayer: mod.Player): void {
    sendAIToObjective(eventPlayer);
}
