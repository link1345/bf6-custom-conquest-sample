import * as modlib from "modlib";

// Team IDs used by Portal. Change these only if your experience uses custom team routing.
const TEAM_1_ID = 1;
const TEAM_2_ID = 2;
const NEUTRAL_TEAM_ID = 0;

// Object ID layout used by the original visual script.
// Capture points are expected to start at 200: A=200, B=201, C=202, and so on.
const CAPTURE_POINT_BASE_ID = 200;
// Vehicle spawners are expected in pairs per objective: 600/601 for A, 610/611 for B, etc.
const VEHICLE_SPAWNER_BASE_ID = 600;
// AI spawner IDs for each team. These must match spawners placed in the Portal experience.
const AI_SPAWNER_TEAM_1 = 901;
const AI_SPAWNER_TEAM_2 = 902;

// Default ticket count for normal Conquest.
const STARTING_TICKETS = 1500;
// Ticket counts used when conquestAssault is enabled.
const ASSAULT_ATTACKER_TICKETS = 2000;
const ASSAULT_DEFENDER_TICKETS = 1500;
// Keep this higher than the ticket scores so Portal's built-in score win condition does not end the match immediately.
const GAME_MODE_TARGET_SCORE = 10000;
// Match length in seconds.
const TIME_LIMIT_SECONDS = 2700;
// Starts near-end music when either team reaches this ticket count.
const LOW_TICKET_MUSIC_THRESHOLD = 100;
// How often ticket bleed is applied, in seconds.
const TICKET_BLEED_INTERVAL_SECONDS = 2;
// Extra ticket loss when one team controls every objective.
const TOTAL_CONTROL_BONUS = 10;
// Capture and neutralization times for every objective, in seconds.
const FLAG_CAPTURE_TIME_SECONDS = 15;
const FLAG_NEUTRAL_TIME_SECONDS = 20;
// Custom AI is disabled by default because Portal can throw OutOfAISpawnQuota when the server already has AI.
const MAX_CUSTOM_AI = 36;
// Scoreboard column index used for sorting. Column 1 is Score.
const SCOREBOARD_SORT_COLUMN = 1;
const CAPTUREPOINT_FLASH_GLOBAL_SLOT = 24;
const TICK_SOUND_LOSING_GLOBAL_SLOT = 20;
const CAPTURED_SOUND_GLOBAL_SLOT = 32;
const CAPTURED_VO_GLOBAL_SLOT = 33;
const CAPTURING_VO_GLOBAL_SLOT = 39;
const TICK_SOUND_TAKING_GLOBAL_SLOT = 44;
const CAPTURE_TICK_SOUND_INTERVAL = 10;
const PLAYER_CAPTURE_HUD_INTERVAL_SECONDS = 0.1;
const AI_ORDER_INTERVAL_SECONDS = 5;

// HUD colors. The first vector is text/bar color, the second is the background color.
const TEAM_1_TEXT = () => mod.CreateVector(0, 0.8, 1);
const TEAM_1_BG = () => mod.CreateVector(0, 0.2, 0.5);
const TEAM_2_TEXT = () => mod.CreateVector(1, 0.2, 0.2);
const TEAM_2_BG = () => mod.CreateVector(0.6, 0.1, 0.1);
const WHITE = () => mod.CreateVector(1, 1, 1);
const BLACK = () => mod.CreateVector(0, 0, 0);

// Objective labels shown in the top HUD. Add more letters if your map has more than 26 capture points.
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

const BOT_NAMES = [
    "andy6170 (Bot)",
    "TheOzzy (Bot)",
    "Mancour (Bot)",
    "gala_vs (Bot)",
    "BattlefieldDad (Bot)",
    "Matavatar (Bot)",
    "ToughKarma (Bot)",
    "extermin8or_ (Bot)",
    "Draco25240 (Bot)",
    "CodeName_Deus (Bot)",
    "TonisGaming (Bot)",
    "SCKGaming (Bot)",
    "HybridBeard0 (Bot)",
    "ClaraTheRed (Bot)",
    "PrincessTeacup (Bot)",
    "Haze (Bot)",
    "Renette (Bot)",
    "BT Zero (Bot)",
    "Thirsty Wizard (Bot)",
    "SwarmFly (Bot)",
    "Sheer Iceman (Bot)",
    "Daniel VNZ (Bot)",
    "Languorian (Bot)",
    "zbmts (Bot)",
    "Joshua (Bot)",
    "Richard (Bot)",
    "Dirteebreaks (Bot)",
    "Mystfit (Bot)",
    "Shorty (Bot)",
    "tango (Bot)",
    "Beam (Bot)",
    "C¥pher (Bot)",
    "ThirdEyeAgent (Bot)",
    "floris12fs (Bot)",
    "oleole56 (Bot)",
    "LadyArsenic (Bot)",
    "Akira72 (Bot)",
    "KieranP (Bot)",
    "warcreator (Bot)",
    "Cytochrome2 (Bot)",
    "LT D.A.L.E. (Bot)",
    "Kale (Bot)",
    "OutlawSkot33 (Bot)",
    "F4rus (Bot)",
    "TabbedScamper (Bot)",
    "reni2 (Bot)",
    "AP_Atipoya (Bot)",
    "m1kedeluca_ (Bot)",
    "Ariistuujj (Bot)",
    "Marcus (DJsparco) (Bot)",
    "Hope (Bot)",
    "pompom (Bot)",
    "mindflexor (Bot)",
    "Robert5974 (Bot)",
    "Ricelletis (Bot)",
    "cczzcx (Bot)",
    "Fobia_BGa (Bot)",
    "Nodone (Bot)",
    "Crush (Bot)",
    "EIGuimaraes (Bot)",
    "Bennen (Bot)",
    "Mary (Bot)",
    "dzonzla_ (Bot)",
    "L0gan-M-Sc0tt (Bot)",
    "FaithWalker (Bot)",
    "SgtHamster (Bot)",
    "LoganTheBrawler (Bot)",
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
    aiTarget?: mod.Player | mod.CapturePoint;
    aiInAction: boolean;
    vehicleStartPosition?: mod.Vector;
    vehicleEnteredAt: number;
    aiActionUntil: number;
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
    lastAIOrderTick: number;
    endGameStarted: boolean;
    aiSpawnBlocked: boolean;
    botNameIndex: number;
    lastBleedTeamId: number;
    lastBleedTime: number;
    lastHudFlashTick: number;
    lastCaptureFlashTick: number;
    captureFlashLoopRunning: boolean;
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
    enableCustomAI: true,
    enableTeamSwitching: true,
    enableVO: true,
    enableOOB: true,
    enableVehicleSpawns: true,
    givePlayersNVG: false,
    conquestAssault: false,
    lastAITick: -1,
    lastAIOrderTick: -1,
    endGameStarted: false,
    aiSpawnBlocked: false,
    botNameIndex: 0,
    lastBleedTeamId: NEUTRAL_TEAM_ID,
    lastBleedTime: -1,
    lastHudFlashTick: -1,
    lastCaptureFlashTick: -1,
    captureFlashLoopRunning: false,
};

// Runtime player state for the current match. This replaces Portal variables for values that do not need persistence.
const playerStates = new Map<number, PlayerState>();
const objectiveHudLoops = new Set<number>();
const playerCaptureHudLoops = new Set<number>();
const playersByCapturePoint = new Map<number, mod.Player[]>();
const captureProgressHudByPoint = new Map<number, CaptureProgressHudState>();

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
        vehicleEnteredAt: -1,
        aiActionUntil: -1,
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

function capturepointFlashGlobalVar(): mod.Variable {
    return mod.GlobalVariable(CAPTUREPOINT_FLASH_GLOBAL_SLOT);
}

function tickSoundLosingGlobalVar(): mod.Variable {
    return mod.GlobalVariable(TICK_SOUND_LOSING_GLOBAL_SLOT);
}

function capturedSoundGlobalVar(): mod.Variable {
    return mod.GlobalVariable(CAPTURED_SOUND_GLOBAL_SLOT);
}

function capturedVoGlobalVar(): mod.Variable {
    return mod.GlobalVariable(CAPTURED_VO_GLOBAL_SLOT);
}

function capturingVoGlobalVar(): mod.Variable {
    return mod.GlobalVariable(CAPTURING_VO_GLOBAL_SLOT);
}

function tickSoundTakingGlobalVar(): mod.Variable {
    return mod.GlobalVariable(TICK_SOUND_TAKING_GLOBAL_SLOT);
}

function getTeamScore(teamValue: mod.Team): number {
    return teamId(teamValue) === TEAM_1_ID ? state.team1Score : state.team2Score;
}

function setTeamScore(teamValue: mod.Team, score: number): void {
    const previous = getTeamScore(teamValue);
    const clamped = Math.max(0, Math.floor(score));
    if (teamId(teamValue) === TEAM_1_ID) {
        state.team1Score = clamped;
    } else {
        state.team2Score = clamped;
    }
    if (clamped < previous) {
        state.lastBleedTeamId = teamId(teamValue);
        state.lastBleedTime = mod.GetMatchTimeElapsed();
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

// Counts objectives owned by a team. Ticket bleed is based on this value.
function countOwnedCapturePoints(owner: mod.Team): number {
    const points = mod.AllCapturePoints();
    let owned = 0;

    for (let i = 0; i < countPortalArray(points); i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        if (mod.Equals(mod.GetCurrentOwnerTeam(point), owner)) owned += 1;
    }

    return owned;
}

type PointOccupancy = {
    players: PlayerCollection;
    team1Count: number;
    team2Count: number;
};

type PlayerCollection = mod.Array | mod.Player[];

type CaptureProgressHudState = {
    progress: number;
    progressSize: mod.Vector;
    progressPosition: mod.Vector;
};

// Counts players from one team on a capture point for the player objective HUD.
function countPlayersInArray(players: PlayerCollection, owner: mod.Team): number {
    let count = 0;

    for (let i = 0; i < countPlayers(players); i += 1) {
        const player = playerValue(players, i);
        if (mod.IsPlayerValid(player) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) && mod.Equals(mod.GetTeam(player), owner)) count += 1;
    }

    return count;
}

function countPlayers(players: PlayerCollection): number {
    return Array.isArray(players) ? players.length : countPortalArray(players);
}

function playerValue(players: PlayerCollection, index: number): mod.Player {
    return Array.isArray(players) ? players[index] : portalArrayValue<mod.Player>(players, index);
}

function pointOccupancy(point: mod.CapturePoint): PointOccupancy {
    const players = mod.GetPlayersOnPoint(point);
    return {
        players,
        team1Count: countPlayersInArray(players, team(TEAM_1_ID)),
        team2Count: countPlayersInArray(players, team(TEAM_2_ID)),
    };
}

function captureProgressHud(point: mod.CapturePoint): CaptureProgressHudState {
    const pointId = mod.GetObjId(point);
    const existing = captureProgressHudByPoint.get(pointId);
    if (existing !== undefined) return existing;
    return updateCaptureProgressHud(point);
}

function updateCaptureProgressHud(point: mod.CapturePoint): CaptureProgressHudState {
    const progress = mod.GetCaptureProgress(point);
    const width = Math.max(2, Math.floor(220 * progress));
    const stateForPoint = {
        progress,
        progressSize: mod.CreateVector(width, 7, 0),
        progressPosition: mod.CreateVector(-110 + width / 2, 200, 0),
    };
    captureProgressHudByPoint.set(mod.GetObjId(point), stateForPoint);
    return stateForPoint;
}

function trackedPointOccupancy(point: mod.CapturePoint): PointOccupancy {
    const pointId = mod.GetObjId(point);
    const onPoint = playersByCapturePoint.get(pointId) ?? [];
    const validPlayers: mod.Player[] = [];
    for (const player of onPoint) {
        const current = playerState(player);
        if (current.onPoint && current.currentCapturePointId === pointId && mod.IsPlayerValid(player)) validPlayers.push(player);
    }

    return {
        players: validPlayers,
        team1Count: countPlayersInArray(validPlayers, team(TEAM_1_ID)),
        team2Count: countPlayersInArray(validPlayers, team(TEAM_2_ID)),
    };
}

function trackPlayerOnPoint(player: mod.Player, point: mod.CapturePoint): void {
    const pointId = mod.GetObjId(point);
    const playerId = mod.GetObjId(player);
    const players = playersByCapturePoint.get(pointId) ?? [];
    if (!players.some((current) => mod.GetObjId(current) === playerId)) players.push(player);
    playersByCapturePoint.set(pointId, players);
}

function untrackPlayerFromPoint(player: mod.Player, pointId: number): void {
    const players = playersByCapturePoint.get(pointId);
    if (players === undefined) return;
    const playerId = mod.GetObjId(player);
    const remaining = players.filter((current) => mod.GetObjId(current) !== playerId);
    if (remaining.length > 0) {
        playersByCapturePoint.set(pointId, remaining);
    } else {
        playersByCapturePoint.delete(pointId);
    }
}

function untrackPlayerFromCurrentPoint(player: mod.Player): void {
    const current = playerState(player);
    if (current.currentCapturePointId >= 0) untrackPlayerFromPoint(player, current.currentCapturePointId);
}

function friendlyCountForTeam(occupancy: PointOccupancy, teamValue: mod.Team): number {
    return teamId(teamValue) === TEAM_1_ID ? occupancy.team1Count : occupancy.team2Count;
}

function enemyCountForTeam(occupancy: PointOccupancy, teamValue: mod.Team): number {
    return teamId(teamValue) === TEAM_1_ID ? occupancy.team2Count : occupancy.team1Count;
}

function playerCanShowCaptureHud(player: mod.Player): boolean {
    return mod.IsPlayerValid(player) && mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
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
    current.vehicleStartPosition = undefined;
    current.vehicleEnteredAt = -1;
    current.aiActionUntil = -1;
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

function sharedHudRootName(): string {
    return "ConquestHUD_Shared_Root";
}

function createSharedHud(): void {
    const rootName = sharedHudRootName();
    if (mod.HasUIWidgetWithName(rootName)) mod.DeleteUIWidget(find(rootName));

    mod.AddUIContainer(rootName, mod.CreateVector(0, 0, 0), mod.CreateVector(2000, 2000, 0), mod.UIAnchor.TopCenter);
    const root = find(rootName);
    mod.SetUIWidgetBgFill(root, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);
    addText("ConquestTimer", mod.CreateVector(0, 50, 0), mod.CreateVector(90, 30, 0), root, timeMessage(), 24, WHITE(), BLACK(), 0.8, mod.UIBgFill.Blur);
    createObjectiveHud(root);
    updateSharedHud();
}

// Creates the team-restricted ticket HUD. Shared timer/objective widgets live in the global HUD.
function createTeamHud(teamValue: mod.Team): void {
    const rootName = scoreRootName(teamValue);
    if (mod.HasUIWidgetWithName(rootName)) mod.DeleteUIWidget(find(rootName));

    mod.AddUIContainer(rootName, mod.CreateVector(0, 0, 0), mod.CreateVector(2000, 2000, 0), mod.UIAnchor.TopCenter, teamValue);
    const root = find(rootName);
    mod.SetUIWidgetBgFill(root, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(root, mod.UIDepth.AboveGameUI);

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
    updateTeamHud(teamValue);
}

function createObjectiveHud(root: mod.UIWidget): void {
    const points = mod.AllCapturePoints();
    const total = Math.max(1, countPortalArray(points));

    for (let i = 0; i < total; i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        const x = (i - (total - 1) / 2) * 50;
        addText(
            objectiveWidgetName(point, "Text"),
            mod.CreateVector(x, 90, 0),
            mod.CreateVector(30, 30, 0),
            root,
            message(flagLetter(point)),
            24,
            objectiveTextColor(point),
            objectiveBgColor(point),
            0.8,
            mod.UIBgFill.Blur,
        );
        addText(
            objectiveWidgetName(point, "Outline"),
            mod.CreateVector(x, 90, 0),
            mod.CreateVector(30, 30, 0),
            root,
            message(""),
            24,
            objectiveTextColor(point),
            objectiveTextColor(point),
            1,
            mod.UIBgFill.OutlineThin,
        );
    }
}

function objectiveWidgetName(point: mod.CapturePoint, suffix: string): string {
    return widgetName(["ConquestObjective", point, suffix]);
}

function objectiveTextColor(point: mod.CapturePoint): mod.Vector {
    const owner = mod.GetCurrentOwnerTeam(point);
    if (teamId(owner) === TEAM_1_ID) return TEAM_1_TEXT();
    if (teamId(owner) === TEAM_2_ID) return TEAM_2_TEXT();
    if (teamId(owner) === NEUTRAL_TEAM_ID) return WHITE();
    return WHITE();
}

function objectiveBgColor(point: mod.CapturePoint): mod.Vector {
    const owner = mod.GetCurrentOwnerTeam(point);
    if (teamId(owner) === TEAM_1_ID) return TEAM_1_BG();
    if (teamId(owner) === TEAM_2_ID) return TEAM_2_BG();
    if (teamId(owner) === NEUTRAL_TEAM_ID) return BLACK();
    return BLACK();
}

type ObjectiveHudAppearance = {
    color: mod.Vector;
    bgColor: mod.Vector;
    alpha: number;
    textBgAlpha: number;
};

function objectiveHudAppearance(point: mod.CapturePoint): ObjectiveHudAppearance {
    const isChanging = isCapturePointChanging(point);
    const sharedAlpha = isChanging ? objectiveFlashAlpha() : 1;
    return {
        color: objectiveTextColor(point),
        bgColor: objectiveBgColor(point),
        alpha: sharedAlpha,
        textBgAlpha: isChanging ? sharedAlpha : 0.8,
    };
}

// Updates one team's view of scores, ticket bars, timer, and objective icons.
function updateTeamHud(teamValue: mod.Team): void {
    const friendly = getTeamScore(teamValue);
    const enemy = getTeamScore(otherTeam(teamValue));
    const friendlyStart = getStartingScore(teamValue);
    const enemyStart = getStartingScore(otherTeam(teamValue));
    const friendlyWidth = ticketBarWidth(friendly, friendlyStart);
    const enemyWidth = ticketBarWidth(enemy, enemyStart);

    setTextIfPresent(widgetName(["ConquestScore", teamValue, "Friendly"]), message("{}", friendly));
    setTextIfPresent(widgetName(["ConquestScore", teamValue, "Enemy"]), message("{}", enemy));
    setWidgetAlphaIfPresent(widgetName(["ConquestScore", teamValue, "Friendly"]), ticketFlashAlpha(teamValue));
    setWidgetAlphaIfPresent(widgetName(["ConquestScore", teamValue, "Enemy"]), ticketFlashAlpha(otherTeam(teamValue)));
    setSizeAndPositionIfPresent(widgetName(["ConquestBar", teamValue, "Friendly"]), mod.CreateVector(friendlyWidth, 10, 0), mod.CreateVector(-260 + friendlyWidth / 2, 60, 0));
    setSizeAndPositionIfPresent(widgetName(["ConquestBar", teamValue, "Enemy"]), mod.CreateVector(enemyWidth, 10, 0), mod.CreateVector(260 - enemyWidth / 2, 60, 0));
}

function ticketFlashAlpha(scoreTeam: mod.Team): number {
    if (getTeamScore(scoreTeam) <= LOW_TICKET_MUSIC_THRESHOLD) return Math.max(0.2, captureFlashAlpha());
    if (state.lastBleedTime < 0 || state.lastBleedTeamId !== teamId(scoreTeam)) return 0.8;
    return Math.max(0.8, 1 - (mod.GetMatchTimeElapsed() - state.lastBleedTime) / 1.75);
}

// Keeps objective letters and small capture-progress bars in sync with the current capture state.
function updateSharedHud(): void {
    updateTimerHud();
    updateObjectiveHud();
}

function updateTimerHud(): void {
    setTextIfPresent("ConquestTimer", timeMessage(), find(sharedHudRootName()));
}

function updateObjectiveHud(): void {
    const points = mod.AllCapturePoints();
    const total = Math.max(1, countPortalArray(points));

    for (let i = 0; i < total; i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        updateObjectiveHudForPoint(point);
    }
}

function updateObjectiveHudForPoint(point: mod.CapturePoint): void {
    const outlineName = objectiveWidgetName(point, "Outline");
    const textName = objectiveWidgetName(point, "Text");
    const appearance = objectiveHudAppearance(point);
    setTextIfPresent(textName, message(flagLetter(point)));
    setWidgetColorIfPresent(textName, appearance.bgColor);
    setTextColorIfPresent(textName, appearance.color);
    setTextColorIfPresent(outlineName, appearance.color);
    setWidgetColorIfPresent(outlineName, appearance.color);
    setTextAlphaIfPresent(textName, appearance.alpha);
    setWidgetAlphaIfPresent(textName, appearance.textBgAlpha);
    setWidgetAlphaIfPresent(outlineName, appearance.alpha);
}

function isCapturePointChanging(point: mod.CapturePoint): boolean {
    const progress = mod.GetCaptureProgress(point);
    return progress > 0 && progress < 1;
}

function objectiveFlashAlpha(): number {
    return captureFlashAlpha();
}

function captureFlashAlpha(): number {
    const value = mod.GetVariable(capturepointFlashGlobalVar());
    return typeof value === "number" ? value : 1;
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

function setTextAlphaIfPresent(name: string, alpha: number): void {
    if (mod.HasUIWidgetWithName(name)) mod.SetUITextAlpha(find(name), alpha);
}

function setWidgetAlphaIfPresent(name: string, alpha: number): void {
    if (mod.HasUIWidgetWithName(name)) mod.SetUIWidgetBgAlpha(find(name), alpha);
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
    updateSharedHud();
    updateTeamHud(team(TEAM_1_ID));
    updateTeamHud(team(TEAM_2_ID));
}

// Applies capture timing and enables each objective for the game mode.
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

function setupCaptureSounds(): void {
    mod.SetVariable(capturedVoGlobalVar(), spawnVOObject());
    mod.SetVariable(capturingVoGlobalVar(), spawnVOObject());
    mod.SetVariable(
        tickSoundTakingGlobalVar(),
        spawnSoundObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickIcon_IsFriendly_OneShot2D),
    );
    mod.SetVariable(
        tickSoundLosingGlobalVar(),
        spawnSoundObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D),
    );
    mod.SetVariable(
        capturedSoundGlobalVar(),
        spawnSoundObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnCapturedByFriendly_OneShot2D),
    );
    mod.SetVariable(capturepointFlashGlobalVar(), 1);
}

function spawnVOObject(): mod.VO {
    return spawnSoundObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D) as unknown as mod.VO;
}

function spawnSoundObject(soundSpawn: mod.Any): mod.Object {
    return mod.SpawnObject(
        soundSpawn ?? mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(0, 0, 0),
    );
}

// Resets all match-scoped state. Customizers can change feature flags here.
function initializeConquestState(): void {
    playerStates.clear();
    objectiveHudLoops.clear();
    playerCaptureHudLoops.clear();
    playersByCapturePoint.clear();
    captureProgressHudByPoint.clear();
    state.initialized = true;
    state.gameOngoing = false;
    state.enableCustomAI = true;
    state.enableTeamSwitching = true;
    state.enableVO = true;
    state.enableOOB = true;
    state.enableVehicleSpawns = true;
    state.givePlayersNVG = false;
    state.conquestAssault = false;
    state.lastTicketBleedTick = -1;
    state.lastHudTick = -1;
    state.lastAITick = -1;
    state.lastAIOrderTick = -1;
    state.lowMusicTriggered = false;
    state.endGameStarted = false;
    state.aiSpawnBlocked = false;
    state.botNameIndex = 0;
    state.lastBleedTeamId = NEUTRAL_TEAM_ID;
    state.lastBleedTime = -1;
    state.lastHudFlashTick = -1;
    state.lastCaptureFlashTick = -1;
    state.captureFlashLoopRunning = false;

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
    createSharedHud();
    createTeamHud(team(TEAM_1_ID));
    createTeamHud(team(TEAM_2_ID));
    mod.LoadMusic(mod.MusicPackages.Core);
    mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
    state.gameOngoing = true;
    setupCaptureSounds();
    startCaptureFlashLoop();
}

// Applies the ticket bleed rules:
// - a full-control bonus when one team owns every objective
// - a loser-only bleed based on the objective ownership difference
function bleedTickets(): void {
    const team1Owned = countOwnedCapturePoints(team(TEAM_1_ID));
    const team2Owned = countOwnedCapturePoints(team(TEAM_2_ID));

    if (team1Owned > 0 && team2Owned === 0) addTeamScore(team(TEAM_2_ID), -TOTAL_CONTROL_BONUS);
    if (team2Owned > 0 && team1Owned === 0) addTeamScore(team(TEAM_1_ID), -TOTAL_CONTROL_BONUS);

    if (team1Owned > team2Owned) {
        addTeamScore(team(TEAM_2_ID), -(team1Owned - team2Owned));
    } else if (team2Owned > team1Owned) {
        addTeamScore(team(TEAM_1_ID), -(team2Owned - team1Owned));
    }
}

// Runs ticket bleed at a fixed interval without relying on async waits.
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

// Refreshes the HUD once per elapsed second.
function maybeRefreshHud(): void {
    if (!state.gameOngoing) return;

    const elapsed = Math.floor(mod.GetMatchTimeElapsed());
    if (elapsed === state.lastHudTick) {
        if (!ticketFlashActive()) return;
        const flashTick = Math.floor(mod.GetMatchTimeElapsed() * 10);
        if (flashTick === state.lastHudFlashTick) return;
        state.lastHudFlashTick = flashTick;
    }
    state.lastHudTick = elapsed;
    updateAllHud();
}

function startCaptureFlashLoop(): void {
    if (state.captureFlashLoopRunning) return;
    state.captureFlashLoopRunning = true;
    void runCaptureFlashLoop();
}

async function runCaptureFlashLoop(): Promise<void> {
    let flashStep = 0;
    while (state.gameOngoing) {
        mod.SetVariable(capturepointFlashGlobalVar(), flashStep / 10);
        flashStep = flashStep >= 8 ? 0 : flashStep + 2;
        await mod.Wait(0.1);
    }
    state.captureFlashLoopRunning = false;
}

function ticketFlashActive(): boolean {
    return (
        (state.lastBleedTime >= 0 && mod.GetMatchTimeElapsed() - state.lastBleedTime < 1.75) ||
        getTeamScore(team(TEAM_1_ID)) <= LOW_TICKET_MUSIC_THRESHOLD ||
        getTeamScore(team(TEAM_2_ID)) <= LOW_TICKET_MUSIC_THRESHOLD
    );
}

// Triggers the low-ticket music only once per match.
function maybeTriggerLowTicketMusic(): void {
    if (state.lowMusicTriggered) return;
    if (getTeamScore(team(TEAM_1_ID)) > LOW_TICKET_MUSIC_THRESHOLD && getTeamScore(team(TEAM_2_ID)) > LOW_TICKET_MUSIC_THRESHOLD) return;

    state.lowMusicTriggered = true;
    mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop);
}

// Ends the match when time runs out or either team's tickets reach zero.
function checkEndGame(): void {
    if (!state.gameOngoing || state.endGameStarted) return;
    if (mod.GetMatchTimeRemaining() > 1 && getTeamScore(team(TEAM_1_ID)) > 0 && getTeamScore(team(TEAM_2_ID)) > 0) return;
    endConquest();
}

// Finalizes the round and chooses the winning team from remaining tickets.
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

// Enables the vehicle spawner pair that belongs to the team currently holding this objective.
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

// Awards capture score to every valid player on the newly captured objective.
function awardCapturePlayers(point: mod.CapturePoint): void {
    const owner = mod.GetCurrentOwnerTeam(point);
    const players = mod.GetPlayersOnPoint(point);

    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (!mod.IsPlayerValid(player) || !mod.Equals(mod.GetTeam(player), owner)) continue;
        addPlayerScore(player, 50, PlayerVar.Captures);
        mod.PlaySound(mod.GetVariable(capturedSoundGlobalVar()), 0.7, player);
    }
}

// Plays the objective captured VO for the owning team.
function playCaptureVO(point: mod.CapturePoint): void {
    if (!state.enableVO) return;
    const owner = mod.GetCurrentOwnerTeam(point);
    mod.PlayVO(mod.GetVariable(capturedVoGlobalVar()), mod.VoiceOverEvents2D.ObjectiveCaptured, voiceOverFlag(point), owner);
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

// Updates the per-player capture HUD that appears while standing inside an objective.
function updatePlayerCaptureHud(player: mod.Player, point: mod.CapturePoint, occupancy: PointOccupancy, progressHud = captureProgressHud(point)): void {
    const progress = progressHud.progress;
    const rootName = widgetName(["ConquestPlayerHUD", player]);
    const friendlyCount = friendlyCountForTeam(occupancy, mod.GetTeam(player));
    const enemyCount = enemyCountForTeam(occupancy, mod.GetTeam(player));
    const owner = mod.GetCurrentOwnerTeam(point);
    const ownerProgressTeam = mod.GetOwnerProgressTeam(point);
    const playerIsProgressOwner = mod.Equals(ownerProgressTeam, mod.GetTeam(player));
    const textColor = mod.Equals(owner, mod.GetTeam(player)) ? TEAM_1_TEXT() : teamId(owner) === NEUTRAL_TEAM_ID ? WHITE() : TEAM_2_TEXT();
    const label = captureStatusLabel(player, point, progress);

    setTextIfPresent(widgetName([rootName, "ObjectiveText"]), message(label));
    setTextIfPresent(widgetName([rootName, "ObjectiveCount"]), message("{} - {}", friendlyCount, enemyCount));
    setTextColorIfPresent(widgetName([rootName, "ObjectiveText"]), textColor);
    setWidgetColorIfPresent(widgetName([rootName, "ObjectiveProgress"]), playerIsProgressOwner ? TEAM_1_TEXT() : TEAM_2_TEXT());
    setSizeAndPositionIfPresent(widgetName([rootName, "ObjectiveProgress"]), progressHud.progressSize, progressHud.progressPosition);
    playCaptureTickSound(player, point, progress);
    playerState(player).lastCaptureProgress = progress;
}

function playCaptureTickSound(player: mod.Player, point: mod.CapturePoint, progress: number): void {
    const current = playerState(player);
    if (current.lastCaptureProgress === progress) {
        current.captureTick = 0;
        return;
    }

    current.captureTick += 1;
    if (current.captureTick % CAPTURE_TICK_SOUND_INTERVAL !== 0) return;

    const progressIncreased = progress > current.lastCaptureProgress;
    const playerIsProgressOwner = mod.Equals(mod.GetTeam(player), mod.GetOwnerProgressTeam(point));
    const takingSound = mod.GetVariable(tickSoundTakingGlobalVar());
    const losingSound = mod.GetVariable(tickSoundLosingGlobalVar());
    if ((progressIncreased && playerIsProgressOwner) || (!progressIncreased && !playerIsProgressOwner)) {
        mod.PlaySound(takingSound, 0.5, player);
    } else {
        mod.PlaySound(losingSound, 0.5, player);
    }
}

// Converts the current objective state into the player-facing label.
function captureStatusLabel(player: mod.Player, point: mod.CapturePoint, progress = mod.GetCaptureProgress(point)): string {
    const owner = mod.GetCurrentOwnerTeam(point);
    if (progress >= 1 && mod.Equals(owner, mod.GetTeam(player))) return "SECURED";
    if (progress >= 1) return "CONTESTED";
    const progressTeam = mod.GetOwnerProgressTeam(point);
    if (mod.Equals(progressTeam, mod.GetTeam(player))) return "CAPTURING";
    if (teamId(progressTeam) === NEUTRAL_TEAM_ID) return "CONTESTED";
    return "LOSING";
}

// Optional custom AI spawner. Disabled by default and blocked after the first quota failure.
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
            mod.SpawnAIFromAISpawner(mod.GetSpawner(AI_SPAWNER_TEAM_1), nextBotName(), team(TEAM_1_ID));
        } else {
            mod.SpawnAIFromAISpawner(mod.GetSpawner(AI_SPAWNER_TEAM_2), nextBotName(), team(TEAM_2_ID));
        }
    } catch (_error) {
        void _error;
        state.aiSpawnBlocked = true;
    }
}

function nextBotName(): mod.Message {
    const name = BOT_NAMES[state.botNameIndex % BOT_NAMES.length];
    state.botNameIndex += 1;
    return message(name);
}

function maybeIssueAIOrders(): void {
    if (!state.enableCustomAI) return;
    const elapsed = Math.floor(mod.GetMatchTimeElapsed());
    if (elapsed === state.lastAIOrderTick || elapsed % AI_ORDER_INTERVAL_SECONDS !== 0) return;
    state.lastAIOrderTick = elapsed;

    const players = mod.AllPlayers();
    for (let i = 0; i < countPortalArray(players); i += 1) {
        const player = portalArrayValue<mod.Player>(players, i);
        if (!mod.IsPlayerValid(player) || !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) continue;
        updateAITimedState(player);
        sendAIToObjective(player);
    }
}

function updateAITimedState(player: mod.Player): void {
    if (!mod.IsPlayerValid(player) || !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;
    const current = playerState(player);
    const elapsed = mod.GetMatchTimeElapsed();

    if (current.aiInAction && current.aiActionUntil >= 0 && elapsed >= current.aiActionUntil) {
        current.aiInAction = false;
        current.aiActionUntil = -1;
    }

    if (
        current.vehicleStartPosition !== undefined &&
        current.vehicleEnteredAt >= 0 &&
        elapsed - current.vehicleEnteredAt >= 10 &&
        mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle)
    ) {
        if (mod.DistanceBetween(mod.GetObjectPosition(player), current.vehicleStartPosition) < 3) {
            mod.ForcePlayerExitVehicle(player, mod.GetVehicleFromPlayer(player));
        }
        current.vehicleStartPosition = undefined;
        current.vehicleEnteredAt = -1;
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

// Picks an enemy or neutral objective for AI movement. Falls back to the first point when all are friendly.
function chooseNearestObjective(player: mod.Player): mod.CapturePoint {
    const points = mod.AllCapturePoints();
    let selected = portalArrayValue<mod.CapturePoint>(points, 0);
    let selectedDistance = mod.DistanceBetween(mod.GetObjectPosition(player), mod.GetObjectPosition(selected));
    let selectedIsEnemyOrNeutral = !mod.Equals(mod.GetCurrentOwnerTeam(selected), mod.GetTeam(player));

    for (let i = 1; i < countPortalArray(points); i += 1) {
        const point = portalArrayValue<mod.CapturePoint>(points, i);
        const owner = mod.GetCurrentOwnerTeam(point);
        const distance = mod.DistanceBetween(mod.GetObjectPosition(player), mod.GetObjectPosition(point));
        const isEnemyOrNeutral = !mod.Equals(owner, mod.GetTeam(player));
        if (isEnemyOrNeutral && (!selectedIsEnemyOrNeutral || distance < selectedDistance)) {
            selected = point;
            selectedDistance = distance;
            selectedIsEnemyOrNeutral = true;
        }
    }

    return selected;
}

// Sends AI toward an objective after deploy, capture-point entry, vehicle exit, or move failure.
function sendAIToObjective(player: mod.Player): void {
    if (!mod.IsPlayerValid(player) || !mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;
    if (playerState(player).aiInAction) return;
    const objective = chooseNearestObjective(player);
    playerState(player).aiTarget = objective;
    mod.AISetMoveSpeed(player, mod.MoveSpeed.Sprint);
    mod.AIMoveToBehavior(player, mod.GetObjectPosition(objective));
}

// Conquest Assault support: defenders lose when team 2 owns no objectives.
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
    maybeIssueAIOrders();
    checkConquestAssaultWin();
    checkEndGame();
}

// Portal event: called when the game mode starts.
export function OnGameModeStarted(): void {
    initializeConquestState();
    startConquest();
}

// Portal event: creates per-player HUD and initializes scoreboard values.
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    initializePlayerState(eventPlayer);
    createPlayerHud(eventPlayer);
    updatePlayerScoreboard(eventPlayer);
    if (state.gameOngoing) updateAllHud();
}

// Portal event: resets temporary player state and gives optional NVG equipment.
export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const current = playerState(eventPlayer);
    untrackPlayerFromCurrentPoint(eventPlayer);
    current.onPoint = false;
    current.outOfBounds = false;
    current.currentCapturePointId = -1;
    current.captureTick = 0;
    setPlayerObjectiveVisible(eventPlayer, false);
    if (state.givePlayersNVG) mod.AddEquipment(eventPlayer, mod.Gadgets.Mask_NVG);
    sendAIToObjective(eventPlayer);
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        mod.SetPlayerIncomingDamageFactor(eventPlayer, 0.5);
    }
}

// Portal event: applies death ticket bleed and updates death stats.
export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, _eventDeathType: mod.DeathType, _eventWeaponUnlock: mod.WeaponUnlock): void {
    void _eventDeathType;
    void _eventWeaponUnlock;
    if (!state.gameOngoing) return;
    const current = playerState(eventPlayer);
    untrackPlayerFromCurrentPoint(eventPlayer);
    current.onPoint = false;
    current.currentCapturePointId = -1;
    current.captureTick = 0;
    setPlayerObjectiveVisible(eventPlayer, false);
    addPlayerScore(eventPlayer, 0, PlayerVar.Deaths);
    addTeamScore(mod.GetTeam(eventPlayer), -1);
    if (mod.IsPlayerValid(eventOtherPlayer)) playerState(eventPlayer).aiTarget = eventOtherPlayer;
    updateAllHud();
    checkEndGame();
}

// Portal event: awards score and kill count for enemy kills.
export function OnPlayerEarnedKill(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, _eventDeathType: mod.DeathType, _eventWeaponUnlock: mod.WeaponUnlock): void {
    void _eventDeathType;
    void _eventWeaponUnlock;
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(eventOtherPlayer))) return;
    addPlayerScore(eventPlayer, 20, PlayerVar.Kills);
}

// Portal event: awards assist score for enemy kill assists.
export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(eventOtherPlayer))) return;
    addPlayerScore(eventPlayer, 10, PlayerVar.Assists);
}

// Portal event: awards revive score to the reviving player.
export function OnRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    if (!mod.IsPlayerValid(eventOtherPlayer)) return;
    addPlayerScore(eventOtherPlayer, 20, PlayerVar.Revives);
    updatePlayerScoreboard(eventPlayer);
}

// Portal event: awards capture score, updates vehicle spawns, and refreshes HUD.
export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): void {
    awardCapturePlayers(eventCapturePoint);
    updateVehicleSpawnerForPoint(eventCapturePoint);
    playCaptureVO(eventCapturePoint);
    updateAllHud();
    checkConquestAssaultWin();
}

// Portal event: plays the "objective capturing" VO when capture progress starts.
export function OnCapturePointCapturing(eventCapturePoint: mod.CapturePoint): void {
    if (!state.enableVO) return;
    mod.PlayVO(mod.GetVariable(capturingVoGlobalVar()), mod.VoiceOverEvents2D.ObjectiveCapturing, voiceOverFlag(eventCapturePoint), mod.GetOwnerProgressTeam(eventCapturePoint));
}

// Portal event: continuously updates player and team objective HUD while a point is active.
export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    updateCaptureProgressHud(eventCapturePoint);
    if (isCapturePointChanging(eventCapturePoint)) {
        startObjectiveHudLoop(eventCapturePoint);
    } else {
        updateObjectiveHudForPoint(eventCapturePoint);
    }
    startPlayerCaptureHudLoop(eventCapturePoint);
}

function updatePlayerCaptureHudsForPoint(point: mod.CapturePoint): boolean {
    const progressHud = updateCaptureProgressHud(point);
    const occupancy = trackedPointOccupancy(point);
    let updatedAnyPlayer = false;
    for (let i = 0; i < countPlayers(occupancy.players); i += 1) {
        const player = playerValue(occupancy.players, i);
        if (playerCanShowCaptureHud(player)) {
            updatedAnyPlayer = true;
            setPlayerObjectiveVisible(player, true);
            updatePlayerCaptureHud(player, point, occupancy, progressHud);
        } else if (mod.IsPlayerValid(player)) {
            setPlayerObjectiveVisible(player, false);
        }
    }
    return updatedAnyPlayer;
}

function startPlayerCaptureHudLoop(point: mod.CapturePoint): void {
    const pointId = mod.GetObjId(point);
    if (playerCaptureHudLoops.has(pointId)) return;
    playerCaptureHudLoops.add(pointId);
    void runPlayerCaptureHudLoop(point, pointId);
}

async function runPlayerCaptureHudLoop(point: mod.CapturePoint, pointId: number): Promise<void> {
    while (state.gameOngoing && updatePlayerCaptureHudsForPoint(point)) {
        await mod.Wait(PLAYER_CAPTURE_HUD_INTERVAL_SECONDS);
    }
    playerCaptureHudLoops.delete(pointId);
}

function startObjectiveHudLoop(point: mod.CapturePoint): void {
    const pointId = mod.GetObjId(point);
    if (objectiveHudLoops.has(pointId)) return;
    objectiveHudLoops.add(pointId);
    void runObjectiveHudLoop(point, pointId);
}

async function runObjectiveHudLoop(point: mod.CapturePoint, pointId: number): Promise<void> {
    while (state.gameOngoing && isCapturePointChanging(point)) {
        updateObjectiveHudForPoint(point);
        await mod.Wait(0.1);
    }
    updateObjectiveHudForPoint(point);
    objectiveHudLoops.delete(pointId);
}

// Portal event: shows the player capture HUD when entering an objective.
export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    if (!playerCanShowCaptureHud(eventPlayer)) {
        setPlayerObjectiveVisible(eventPlayer, false);
        return;
    }
    const current = playerState(eventPlayer);
    untrackPlayerFromCurrentPoint(eventPlayer);
    current.onPoint = true;
    current.currentCapturePointId = mod.GetObjId(eventCapturePoint);
    const progressHud = updateCaptureProgressHud(eventCapturePoint);
    current.lastCaptureProgress = progressHud.progress;
    trackPlayerOnPoint(eventPlayer, eventCapturePoint);
    setPlayerObjectiveVisible(eventPlayer, true);
    updatePlayerCaptureHud(eventPlayer, eventCapturePoint, pointOccupancy(eventCapturePoint), progressHud);
    startPlayerCaptureHudLoop(eventCapturePoint);
    sendAIToObjective(eventPlayer);
}

// Portal event: hides the player capture HUD when leaving an objective.
export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, _eventCapturePoint: mod.CapturePoint): void {
    const current = playerState(eventPlayer);
    untrackPlayerFromPoint(eventPlayer, mod.GetObjId(_eventCapturePoint));
    current.onPoint = false;
    current.currentCapturePointId = -1;
    current.captureTick = 0;
    setPlayerObjectiveVisible(eventPlayer, false);
}

// Portal event: optional team switching through interact points with IDs 1 and 2.
export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint): void {
    if (!state.enableTeamSwitching) return;
    const id = mod.GetObjId(eventInteractPoint);
    if (id === TEAM_1_ID) mod.SetTeam(eventPlayer, team(TEAM_1_ID));
    if (id === TEAM_2_ID) mod.SetTeam(eventPlayer, team(TEAM_2_ID));
}

// Portal event: shows the out-of-bounds warning UI when enabled.
export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, _eventAreaTrigger: mod.AreaTrigger): void {
    void _eventAreaTrigger;
    const current = playerState(eventPlayer);
    if (!state.enableOOB || current.ignoreOOB) return;
    current.outOfBounds = true;
    setPlayerOobVisible(eventPlayer, true);
}

// Portal event: hides the out-of-bounds warning UI.
export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, _eventAreaTrigger: mod.AreaTrigger): void {
    void _eventAreaTrigger;
    playerState(eventPlayer).outOfBounds = false;
    setPlayerOobVisible(eventPlayer, false);
}

// Portal event: makes damaged AI focus the attacker.
export function OnPlayerDamaged(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, _eventDamageType: mod.DamageType, _eventWeaponUnlock: mod.WeaponUnlock): void {
    void _eventDamageType;
    void _eventWeaponUnlock;
    if (!mod.IsPlayerValid(eventPlayer) || !mod.IsPlayerValid(eventOtherPlayer)) return;
    if (
        mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier) &&
        !playerState(eventPlayer).aiInAction &&
        !mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInVehicle) &&
        !mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(eventOtherPlayer))
    ) {
        const current = playerState(eventPlayer);
        current.aiInAction = true;
        current.aiActionUntil = mod.GetMatchTimeElapsed() + 10;
        current.aiTarget = eventOtherPlayer;
        mod.AIDefendPositionBehavior(eventPlayer, mod.GetObjectPosition(eventPlayer), 0, 15);
        mod.AISetMoveSpeed(eventPlayer, mod.MoveSpeed.InvestigateRun);
        mod.AISetTarget(eventPlayer, eventOtherPlayer);
    }
}

// Portal event: returns AI to battlefield behavior when entering a vehicle.
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, _eventVehicle: mod.Vehicle): void {
    void _eventVehicle;
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        mod.AIBattlefieldBehavior(eventPlayer);
        playerState(eventPlayer).vehicleStartPosition = mod.GetObjectPosition(eventPlayer);
        playerState(eventPlayer).vehicleEnteredAt = mod.GetMatchTimeElapsed();
    }
}

// Portal event: sends AI back toward an objective after leaving a vehicle.
export function OnPlayerExitVehicle(eventPlayer: mod.Player, _eventVehicle: mod.Vehicle): void {
    void _eventVehicle;
    sendAIToObjective(eventPlayer);
}

// Portal event: retries objective movement when AI pathing fails.
export function OnAIMoveToFailed(eventPlayer: mod.Player): void {
    sendAIToObjective(eventPlayer);
}
