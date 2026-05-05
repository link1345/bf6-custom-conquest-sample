import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    OnCapturePointCaptured,
    OnCapturePointCapturing,
    OnGameModeStarted,
    OnPlayerDied,
    OnPlayerDeployed,
    OnPlayerEarnedKill,
    OnPlayerEnterCapturePoint,
    OnPlayerJoinGame,
    OngoingCapturePoint,
    OngoingGlobal,
} from "../mods/Script";
import { setupBfPortalMock, type BfPortalModMock } from "../test-support/bfportal-vitest-mock.generated";
import stringkeys from "../dist/Strings.json";

type FakeTeam = { id: number; kind: "team" };
type FakePoint = { id: number; kind: "point"; owner: FakeTeam; progressOwner: FakeTeam; progress: number; players: FakePlayer[] };
type FakePlayer = { id: number; kind: "player"; team: FakeTeam; ai?: boolean; alive?: boolean; inVehicle?: boolean };
type FakeWidget = { name: string; position?: mod.Vector; size?: mod.Vector };

const teams: Record<number, FakeTeam> = {
    0: { id: 0, kind: "team" },
    1: { id: 1, kind: "team" },
    2: { id: 2, kind: "team" },
};

let points: FakePoint[];
let allPlayers: FakePlayer[];
let widgets: Map<string, FakeWidget>;
let variables: Map<string, unknown>;
let elapsed: number;
let remaining: number;
let waitResolvers: Array<() => void>;
let modMock: BfPortalModMock;

function vector(x: number, y: number, z: number): mod.Vector {
    return { __test: true, x, y, z } as unknown as mod.Vector;
}

function asModArray<T>(items: T[]): mod.Array {
    return items as unknown as mod.Array;
}

function objId(value: unknown): number {
    if (typeof value === "number") return value;
    return (value as { id?: number }).id ?? 0;
}

function varKey(prefix: string, id: number, slot?: number): mod.Variable {
    return `${prefix}:${id}${slot === undefined ? "" : `:${slot}`}` as unknown as mod.Variable;
}

function widgetArgName(args: unknown[]): string {
    return String(args[0]);
}

function setupPortalMock(): void {
    widgets = new Map();
    variables = new Map();
    waitResolvers = [];
    elapsed = 0;
    remaining = 2700;
    points = [
        { id: 200, kind: "point", owner: teams[1], progressOwner: teams[1], progress: 1, players: [] },
        { id: 201, kind: "point", owner: teams[1], progressOwner: teams[1], progress: 1, players: [] },
        { id: 202, kind: "point", owner: teams[2], progressOwner: teams[2], progress: 1, players: [] },
    ];
    allPlayers = [];

    modMock = setupBfPortalMock(
        {
            Add: ((a: number, b: number) => a + b) as typeof mod.Add,
            AddEquipment: (() => undefined) as typeof mod.AddEquipment,
            AddUIContainer: vi.fn((...args: unknown[]) => {
                widgets.set(widgetArgName(args), { name: widgetArgName(args), position: args[1] as mod.Vector, size: args[2] as mod.Vector });
            }) as unknown as typeof mod.AddUIContainer,
            AddUIText: vi.fn((...args: unknown[]) => {
                widgets.set(widgetArgName(args), { name: widgetArgName(args), position: args[1] as mod.Vector, size: args[2] as mod.Vector });
            }) as unknown as typeof mod.AddUIText,
            AIBattlefieldBehavior: vi.fn(() => undefined) as unknown as typeof mod.AIBattlefieldBehavior,
            AIDefendPositionBehavior: vi.fn(() => undefined) as unknown as typeof mod.AIDefendPositionBehavior,
            AIMoveToBehavior: vi.fn(() => undefined) as unknown as typeof mod.AIMoveToBehavior,
            AISetMoveSpeed: (() => undefined) as typeof mod.AISetMoveSpeed,
            AISetTarget: (() => undefined) as typeof mod.AISetTarget,
            AllCapturePoints: () => asModArray(points),
            AllPlayers: () => asModArray(allPlayers),
            CountOf: (array: mod.Array) => (array as unknown as unknown[]).length,
            CreateVector: vector,
            DeleteUIWidget: ((widget: FakeWidget) => widgets.delete(widget.name)) as unknown as typeof mod.DeleteUIWidget,
            DistanceBetween: ((a: mod.Vector, b: mod.Vector) => Math.abs((a as unknown as { x: number }).x - (b as unknown as { x: number }).x)) as typeof mod.DistanceBetween,
            EmptyArray: () => asModArray([]),
            EnableCapturePointDeploying: (() => undefined) as typeof mod.EnableCapturePointDeploying,
            EnableGameModeObjective: (() => undefined) as typeof mod.EnableGameModeObjective,
            EndGameMode: (() => undefined) as typeof mod.EndGameMode,
            Equals: ((a: unknown, b: unknown) => objId(a) === objId(b)) as typeof mod.Equals,
            FindUIWidgetWithName: ((name: string) => widgets.get(name) ?? { name }) as typeof mod.FindUIWidgetWithName,
            Floor: Math.floor,
            GetCaptureProgress: (point: mod.CapturePoint) => (point as unknown as FakePoint).progress,
            GetCurrentOwnerTeam: (point: mod.CapturePoint) => (point as unknown as FakePoint).owner as unknown as mod.Team,
            GetMatchTimeElapsed: () => elapsed,
            GetMatchTimeRemaining: () => remaining,
            GetObjId: (value: mod.Object) => objId(value),
            GetObjectPosition: ((value: mod.Object) => vector(objId(value), 0, 0)) as typeof mod.GetObjectPosition,
            GetOwnerProgressTeam: (point: mod.CapturePoint) => (point as unknown as FakePoint).progressOwner as unknown as mod.Team,
            GetPlayersOnPoint: vi.fn((point: mod.CapturePoint) => asModArray((point as unknown as FakePoint).players)) as unknown as typeof mod.GetPlayersOnPoint,
            GetSpawner: ((id: number) => ({ id, kind: "spawner" })) as unknown as typeof mod.GetSpawner,
            GetSoldierState: ((player: FakePlayer, state: string) => {
                if (state === "IsAISoldier") return player.ai === true;
                if (state === "IsInVehicle") return player.inVehicle === true;
                if (state === "IsAlive") return player.alive !== false;
                return false;
            }) as unknown as typeof mod.GetSoldierState,
            GetTeam: ((value: number | FakePlayer) => (typeof value === "number" ? teams[value] : value.team)) as unknown as typeof mod.GetTeam,
            GetUIWidgetPosition: vi.fn((widget: mod.UIWidget) => (widget as unknown as FakeWidget).position ?? vector(0, 0, 0)) as unknown as typeof mod.GetUIWidgetPosition,
            GetVariable: (variable: mod.Variable) => variables.get(String(variable)),
            GetVehicleSpawner: ((id: number) => ({ id, kind: "vehicleSpawner" })) as unknown as typeof mod.GetVehicleSpawner,
            GlobalVariable: (slot: number) => varKey("g", slot),
            HasUIWidgetWithName: ((name: string) => widgets.has(name)) as typeof mod.HasUIWidgetWithName,
            IsPlayerValid: () => true,
            LoadMusic: (() => undefined) as typeof mod.LoadMusic,
            Message: ((msg: string | number | mod.Player, arg0?: string | number | mod.Player, arg1?: string | number | mod.Player, arg2?: string | number | mod.Player) =>
                ({ __test: true, msg, args: [arg0, arg1, arg2] }) as unknown as mod.Message) as typeof mod.Message,
            ObjectVariable: ((owner: mod.Object, slot: number) => varKey("o", objId(owner), slot)) as typeof mod.ObjectVariable,
            PauseGameModeTime: (() => undefined) as typeof mod.PauseGameModeTime,
            PlayMusic: (() => undefined) as typeof mod.PlayMusic,
            PlayVO: vi.fn(() => undefined) as unknown as typeof mod.PlayVO,
            SetCapturePointCapturingTime: (() => undefined) as typeof mod.SetCapturePointCapturingTime,
            SetCapturePointNeutralizationTime: (() => undefined) as typeof mod.SetCapturePointNeutralizationTime,
            SetGameModeScore: (() => undefined) as typeof mod.SetGameModeScore,
            SetGameModeTargetScore: (() => undefined) as typeof mod.SetGameModeTargetScore,
            SetGameModeTimeLimit: (() => undefined) as typeof mod.SetGameModeTimeLimit,
            SetMaxCaptureMultiplier: (() => undefined) as typeof mod.SetMaxCaptureMultiplier,
            SetMusicParam: (() => undefined) as typeof mod.SetMusicParam,
            SetScoreboardColumnNames: (() => undefined) as typeof mod.SetScoreboardColumnNames,
            SetScoreboardColumnWidths: (() => undefined) as typeof mod.SetScoreboardColumnWidths,
            SetScoreboardHeader: (() => undefined) as typeof mod.SetScoreboardHeader,
            SetScoreboardPlayerValues: (() => undefined) as typeof mod.SetScoreboardPlayerValues,
            SetScoreboardSorting: (() => undefined) as typeof mod.SetScoreboardSorting,
            SetScoreboardType: (() => undefined) as typeof mod.SetScoreboardType,
            SetTeam: (() => undefined) as typeof mod.SetTeam,
            SetUITextAlpha: vi.fn(() => undefined) as unknown as typeof mod.SetUITextAlpha,
            SetUITextColor: vi.fn(() => undefined) as unknown as typeof mod.SetUITextColor,
            SetUITextLabel: vi.fn(() => undefined) as unknown as typeof mod.SetUITextLabel,
            SetUIWidgetBgAlpha: vi.fn(() => undefined) as unknown as typeof mod.SetUIWidgetBgAlpha,
            SetUIWidgetBgColor: vi.fn(() => undefined) as unknown as typeof mod.SetUIWidgetBgColor,
            SetUIWidgetBgFill: (() => undefined) as typeof mod.SetUIWidgetBgFill,
            SetUIWidgetDepth: (() => undefined) as typeof mod.SetUIWidgetDepth,
            SetUIWidgetPosition: vi.fn((widget: FakeWidget, position: mod.Vector) => {
                widget.position = position;
            }) as unknown as typeof mod.SetUIWidgetPosition,
            SetUIWidgetSize: vi.fn((widget: FakeWidget, size: mod.Vector) => {
                widget.size = size;
            }) as unknown as typeof mod.SetUIWidgetSize,
            SetUIWidgetVisible: vi.fn(() => undefined) as unknown as typeof mod.SetUIWidgetVisible,
            SetUnspawnDelayInSeconds: (() => undefined) as typeof mod.SetUnspawnDelayInSeconds,
            SetVariable: ((variable: mod.Variable, value: unknown) => {
                variables.set(String(variable), value);
            }) as typeof mod.SetVariable,
            SetVehicleCategoryAllowedInSurroundingArea: (() => undefined) as typeof mod.SetVehicleCategoryAllowedInSurroundingArea,
            SetVehicleSpawnerAutoSpawn: (() => undefined) as typeof mod.SetVehicleSpawnerAutoSpawn,
            SpawnAIFromAISpawner: vi.fn(() => undefined) as unknown as typeof mod.SpawnAIFromAISpawner,
            SpawnObject: vi.fn((spawn: unknown) => ({ id: objId(spawn), kind: "spawned" })) as unknown as typeof mod.SpawnObject,
            ValueInArray: (array: mod.Array, index: number) => (array as unknown as unknown[])[index],
            Wait: vi.fn(
                () =>
                    new Promise<void>((resolve) => {
                        waitResolvers.push(resolve);
                    }),
            ) as unknown as typeof mod.Wait,
        },
        {
            stringkeys,
            Gadgets: { Mask_NVG: "Mask_NVG" } as unknown as typeof mod.Gadgets,
            MoveSpeed: { InvestigateRun: "InvestigateRun", Sprint: "Sprint" } as unknown as typeof mod.MoveSpeed,
            MusicEvents: {
                Core_EndOfRound_Loop: "Core_EndOfRound_Loop",
                Core_LastPhaseBegin: "Core_LastPhaseBegin",
                Core_Overtime_Loop: "Core_Overtime_Loop",
            } as unknown as typeof mod.MusicEvents,
            MusicPackages: { Core: "Core" } as unknown as typeof mod.MusicPackages,
            MusicParams: { Core_IsWinning: "Core_IsWinning" } as unknown as typeof mod.MusicParams,
            RuntimeSpawn_Common: { SFX_VOModule_OneShot2D: 1 } as unknown as typeof mod.RuntimeSpawn_Common,
            ScoreboardType: { CustomTwoTeams: "CustomTwoTeams" } as unknown as typeof mod.ScoreboardType,
            SoldierStateBool: { IsAISoldier: "IsAISoldier", IsAlive: "IsAlive", IsInVehicle: "IsInVehicle" } as unknown as typeof mod.SoldierStateBool,
            UIAnchor: { Center: "Center", TopCenter: "TopCenter" } as unknown as typeof mod.UIAnchor,
            UIBgFill: { Blur: "Blur", None: "None", OutlineThin: "OutlineThin", Solid: "Solid" } as unknown as typeof mod.UIBgFill,
            UIDepth: { AboveGameUI: "AboveGameUI" } as unknown as typeof mod.UIDepth,
            VehicleCategories: { Air_All: "Air_All" } as unknown as typeof mod.VehicleCategories,
            VoiceOverEvents2D: {
                ObjectiveCaptured: "ObjectiveCaptured",
                ObjectiveCapturing: "ObjectiveCapturing",
            } as unknown as typeof mod.VoiceOverEvents2D,
            VoiceOverFlags: {
                Alpha: "Alpha",
                Bravo: "Bravo",
                Charlie: "Charlie",
                Delta: "Delta",
                Echo: "Echo",
                Foxtrot: "Foxtrot",
                Golf: "Golf",
                Hotel: "Hotel",
                India: "India",
            } as unknown as typeof mod.VoiceOverFlags,
        },
    );
}

beforeEach(() => {
    vi.resetAllMocks();
    setupPortalMock();
});

describe("Conquest script", () => {
    it("includes scoreboard team names in the string table", () => {
        expect(Object.values(stringkeys)).toEqual(expect.arrayContaining(["Team 1", "Team 2"]));
    });

    it("sets up conquest rules, capture points, scoreboard, and HUD on game start", () => {
        OnGameModeStarted();

        expect(modMock.SetGameModeTimeLimit).toHaveBeenCalledWith(2700);
        expect(modMock.SetGameModeTargetScore).toHaveBeenCalledWith(10000);
        expect(modMock.SetCapturePointCapturingTime).toHaveBeenCalledTimes(3);
        expect(modMock.SetCapturePointNeutralizationTime).toHaveBeenCalledTimes(3);
        expect(modMock.SetScoreboardType).toHaveBeenCalledWith(mod.ScoreboardType.CustomTwoTeams);
        expect(modMock.AddUIContainer).toHaveBeenCalledWith("ConquestHUD_Shared_Root", expect.anything(), expect.anything(), mod.UIAnchor.TopCenter);
        expect(modMock.AddUIContainer).toHaveBeenCalledWith("ConquestHUD_1_Root", expect.anything(), expect.anything(), mod.UIAnchor.TopCenter, teams[1]);
    });

    it("bleeds tickets from the team with fewer owned objectives", () => {
        OnGameModeStarted();
        elapsed = 2;

        OngoingGlobal();

        expect(modMock.SetGameModeScore).toHaveBeenCalledWith(teams[2], 1499);
    });

    it("updates player score for joins, kills, deaths, and captures", () => {
        const player1: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        const player2: FakePlayer = { id: 20, kind: "player", team: teams[2] };
        points[0].players = [player1];

        OnGameModeStarted();
        OnPlayerJoinGame(player1 as unknown as mod.Player);
        OnPlayerEarnedKill(player1 as unknown as mod.Player, player2 as unknown as mod.Player, {} as mod.DeathType, {} as mod.WeaponUnlock);
        OnPlayerDied(player2 as unknown as mod.Player, player1 as unknown as mod.Player, {} as mod.DeathType, {} as mod.WeaponUnlock);
        OnCapturePointCaptured(points[0] as unknown as mod.CapturePoint);

        expect(modMock.SetScoreboardPlayerValues).toHaveBeenLastCalledWith(player1, 70, 1, 0, 0, 1);
        expect(modMock.SetGameModeScore).toHaveBeenCalledWith(teams[2], 1499);
    });

    it("ends the match for the higher ticket team when time expires", () => {
        OnGameModeStarted();
        remaining = 0;
        elapsed = 2;

        OngoingGlobal();

        expect(modMock.PauseGameModeTime).toHaveBeenCalledWith(true);
        expect(modMock.EndGameMode).toHaveBeenCalledWith(teams[1]);
    });

    it("creates player-specific HUD names so players do not collide", () => {
        const player1: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        const player2: FakePlayer = { id: 11, kind: "player", team: teams[1] };

        OnPlayerJoinGame(player1 as unknown as mod.Player);
        OnPlayerJoinGame(player2 as unknown as mod.Player);

        expect(widgets.has("ConquestPlayerHUD_10")).toBe(true);
        expect(widgets.has("ConquestPlayerHUD_11")).toBe(true);
        expect(widgets.has("ConquestPlayerHUD_10_ObjectiveText")).toBe(true);
        expect(widgets.has("ConquestPlayerHUD_11_ObjectiveText")).toBe(true);
    });

    it("auto-spawns custom AI using the smaller team while under the bot cap", () => {
        OnGameModeStarted();
        elapsed = 1;

        OngoingGlobal();

        expect(modMock.SpawnAIFromAISpawner).toHaveBeenCalledWith(expect.objectContaining({ id: 901 }), expect.objectContaining({ msg: "andy6170 (Bot)" }), teams[1]);
    });

    it("rotates custom AI bot names from the original AddBotNames list", () => {
        OnGameModeStarted();
        elapsed = 1;
        OngoingGlobal();
        elapsed = 2;
        OngoingGlobal();

        expect(modMock.SpawnAIFromAISpawner).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 901 }), expect.objectContaining({ msg: "andy6170 (Bot)" }), teams[1]);
        expect(modMock.SpawnAIFromAISpawner).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 901 }), expect.objectContaining({ msg: "TheOzzy (Bot)" }), teams[1]);
    });

    it("updates objective HUD progress without reading widget positions", () => {
        OnGameModeStarted();

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(modMock.GetUIWidgetPosition).not.toHaveBeenCalled();
    });

    it("does not count dead players in the capture point player count", () => {
        const player: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        const deadFriendly: FakePlayer = { id: 11, kind: "player", team: teams[1], alive: false };
        const enemy: FakePlayer = { id: 20, kind: "player", team: teams[2] };
        points[0].players = [player, deadFriendly, enemy];

        OnPlayerJoinGame(player as unknown as mod.Player);
        OnPlayerEnterCapturePoint(player as unknown as mod.Player, points[0] as unknown as mod.CapturePoint);

        const countCall = vi.mocked(modMock.SetUITextLabel).mock.calls.find(([widget]) => (widget as FakeWidget).name === "ConquestPlayerHUD_10_ObjectiveCount");
        expect((countCall?.[1] as unknown as { args: unknown[] }).args).toEqual([1, 1, undefined]);
    });

    it("colors CAPTURING as neutral while the point owner is neutral", () => {
        const player: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        points[0].owner = teams[0];
        points[0].progressOwner = teams[1];
        points[0].progress = 0.5;

        OnPlayerJoinGame(player as unknown as mod.Player);
        OnPlayerEnterCapturePoint(player as unknown as mod.Player, points[0] as unknown as mod.CapturePoint);

        expect(modMock.SetUITextColor).toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestPlayerHUD_10_ObjectiveText" }), vector(1, 1, 1));
    });

    it("uses objective outline widgets instead of separate progress bars", () => {
        OnGameModeStarted();

        expect(widgets.has("ConquestObjective_200_Text")).toBe(true);
        expect(widgets.has("ConquestObjective_200_Outline")).toBe(true);
        expect(widgets.has("ConquestObjective_1_200_Text")).toBe(false);
        expect(widgets.has("ConquestObjective_200_Progress")).toBe(false);
        expect(widgets.get("ConquestObjective_200_Outline")?.size).toEqual(widgets.get("ConquestObjective_200_Text")?.size);
        expect(vi.mocked(modMock.AddUIText).mock.calls.some(([name]) => name === "ConquestObjective_200_Outline")).toBe(true);
        expect(vi.mocked(modMock.AddUIContainer).mock.calls.some(([name]) => name === "ConquestObjective_200_Outline")).toBe(false);
    });

    it("creates the timer as a single shared widget", () => {
        OnGameModeStarted();

        const timerWidgets = vi.mocked(modMock.AddUIText).mock.calls.filter(([name]) => name === "ConquestTimer");
        expect(timerWidgets).toHaveLength(1);
    });

    it("flashes objective text and outline with the same alpha while a flag is changing", () => {
        points[0].progress = 0.5;
        OnGameModeStarted();

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        const textAlphaCalls = vi.mocked(modMock.SetUITextAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestObjective_200_Text");
        const textBgAlphaCalls = vi.mocked(modMock.SetUIWidgetBgAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestObjective_200_Text");
        const outlineAlphaCalls = vi.mocked(modMock.SetUIWidgetBgAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestObjective_200_Outline");
        expect(textAlphaCalls.at(-1)?.[1]).toBeCloseTo(0);
        expect(textBgAlphaCalls.at(-1)?.[1]).toBeCloseTo(0);
        expect(outlineAlphaCalls.at(-1)?.[1]).toBeCloseTo(0);
        expect(outlineAlphaCalls.at(-1)?.[1]).toBe(textAlphaCalls.at(-1)?.[1]);
    });

    it("uses the same owner color for objective text and outline while a flag is changing", () => {
        points[0].owner = teams[2];
        points[0].progressOwner = teams[1];
        points[0].progress = 0.5;
        OnGameModeStarted();

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(modMock.SetUITextColor).toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestObjective_200_Text" }), vector(1, 0.2, 0.2));
        expect(modMock.SetUITextColor).toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestObjective_200_Outline" }), vector(1, 0.2, 0.2));
        expect(modMock.SetUIWidgetBgColor).toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestObjective_200_Outline" }), vector(1, 0.2, 0.2));
    });

    it("reuses VO objects instead of spawning them during capture events", () => {
        OnGameModeStarted();
        const spawnCountAfterStart = vi.mocked(modMock.SpawnObject).mock.calls.length;

        OnCapturePointCapturing(points[0] as unknown as mod.CapturePoint);
        OnCapturePointCapturing(points[0] as unknown as mod.CapturePoint);
        OnCapturePointCaptured(points[0] as unknown as mod.CapturePoint);

        expect(modMock.SpawnObject).toHaveBeenCalledTimes(spawnCountAfterStart);
        expect(modMock.PlayVO).toHaveBeenCalledTimes(3);
    });

    it("does not start duplicate objective HUD wait loops for the same point", () => {
        points[0].progress = 0.5;
        OnGameModeStarted();
        const waitsAfterStart = waitResolvers.length;

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);
        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(waitResolvers.length).toBe(waitsAfterStart + 1);
    });

    it("does not start an objective HUD wait loop when the point is not changing", () => {
        points[0].progress = 1;
        OnGameModeStarted();
        const waitsAfterStart = waitResolvers.length;

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(waitResolvers.length).toBe(waitsAfterStart);
    });

    it("restores objective UI alpha when the flag stops changing", async () => {
        points[0].progress = 0.5;
        OnGameModeStarted();
        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);
        const objectiveWait = waitResolvers.at(-1);
        expect(objectiveWait).toBeDefined();

        points[0].progress = 1;
        objectiveWait?.();
        await Promise.resolve();

        const textAlphaCalls = vi.mocked(modMock.SetUITextAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestObjective_200_Text");
        const textBgAlphaCalls = vi.mocked(modMock.SetUIWidgetBgAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestObjective_200_Text");
        const outlineAlphaCalls = vi.mocked(modMock.SetUIWidgetBgAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestObjective_200_Outline");
        expect(textAlphaCalls.at(-1)?.[1]).toBe(1);
        expect(textBgAlphaCalls.at(-1)?.[1]).toBe(0.8);
        expect(outlineAlphaCalls.at(-1)?.[1]).toBe(1);
        expect(outlineAlphaCalls.at(-1)?.[1]).toBe(textAlphaCalls.at(-1)?.[1]);
    });

    it("reuses one capture-point player list for every personal HUD update", () => {
        const player1: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        const player2: FakePlayer = { id: 11, kind: "player", team: teams[1] };
        const enemy: FakePlayer = { id: 20, kind: "player", team: teams[2] };
        const deadEnemy: FakePlayer = { id: 21, kind: "player", team: teams[2], alive: false };
        points[0].players = [player1, player2, enemy, deadEnemy];
        OnPlayerJoinGame(player1 as unknown as mod.Player);
        OnPlayerJoinGame(player2 as unknown as mod.Player);
        OnGameModeStarted();
        vi.mocked(modMock.GetPlayersOnPoint).mockClear();

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(modMock.GetPlayersOnPoint).toHaveBeenCalledTimes(1);
        const countCalls = vi.mocked(modMock.SetUITextLabel).mock.calls.filter(([widget]) => String((widget as FakeWidget).name).endsWith("ObjectiveCount"));
        expect((countCalls.find(([widget]) => (widget as FakeWidget).name === "ConquestPlayerHUD_10_ObjectiveCount")?.[1] as unknown as { args: unknown[] }).args).toEqual([2, 1, undefined]);
        expect((countCalls.find(([widget]) => (widget as FakeWidget).name === "ConquestPlayerHUD_11_ObjectiveCount")?.[1] as unknown as { args: unknown[] }).args).toEqual([2, 1, undefined]);
    });

    it("throttles personal capture HUD updates per objective", () => {
        const player: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        points[0].players = [player];
        OnPlayerJoinGame(player as unknown as mod.Player);
        OnGameModeStarted();
        vi.mocked(modMock.GetPlayersOnPoint).mockClear();

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);
        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);
        elapsed = 1;
        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(modMock.GetPlayersOnPoint).toHaveBeenCalledTimes(2);
    });

    it("hides the personal capture HUD for dead players", () => {
        const player: FakePlayer = { id: 10, kind: "player", team: teams[1], alive: false };
        points[0].players = [player];
        OnPlayerJoinGame(player as unknown as mod.Player);
        OnGameModeStarted();
        vi.mocked(modMock.SetUITextLabel).mockClear();

        OnPlayerEnterCapturePoint(player as unknown as mod.Player, points[0] as unknown as mod.CapturePoint);
        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(modMock.SetUIWidgetVisible).toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestPlayerHUD_10_ObjectiveText" }), false);
        expect(modMock.SetUITextLabel).not.toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestPlayerHUD_10_ObjectiveText" }), expect.anything());
    });

    it("hides the personal capture HUD when a player dies or deploys", () => {
        const player: FakePlayer = { id: 10, kind: "player", team: teams[1] };
        const enemy: FakePlayer = { id: 20, kind: "player", team: teams[2] };
        OnPlayerJoinGame(player as unknown as mod.Player);
        OnGameModeStarted();
        OnPlayerEnterCapturePoint(player as unknown as mod.Player, points[0] as unknown as mod.CapturePoint);
        vi.mocked(modMock.SetUIWidgetVisible).mockClear();

        OnPlayerDied(player as unknown as mod.Player, enemy as unknown as mod.Player, {} as mod.DeathType, {} as mod.WeaponUnlock);
        OnPlayerDeployed(player as unknown as mod.Player);

        const textVisibilityCalls = vi.mocked(modMock.SetUIWidgetVisible).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestPlayerHUD_10_ObjectiveText");
        expect(textVisibilityCalls.map(([, visible]) => visible)).toEqual([false, false]);
    });

    it("briefly makes the losing ticket background opaque when tickets bleed", () => {
        OnGameModeStarted();
        elapsed = 2;

        OngoingGlobal();

        expect(modMock.SetUIWidgetBgAlpha).toHaveBeenCalledWith(expect.objectContaining({ name: "ConquestScore_1_Enemy" }), 1);
    });

    it("smoothly fades the losing ticket background after tickets bleed", () => {
        OnGameModeStarted();
        elapsed = 2;
        OngoingGlobal();

        elapsed = 2.175;
        OngoingGlobal();

        const enemyScoreAlphaCalls = vi.mocked(modMock.SetUIWidgetBgAlpha).mock.calls.filter(([widget]) => (widget as FakeWidget).name === "ConquestScore_1_Enemy");
        expect(enemyScoreAlphaCalls.at(-1)?.[1]).toBeCloseTo(0.9);
    });

    it("sends AI to an enemy objective even when the first objective is friendly and closer", () => {
        const aiPlayer: FakePlayer = { id: 200, kind: "player", team: teams[1], ai: true };
        points[0].owner = teams[1];
        points[1].owner = teams[1];
        points[2].owner = teams[2];
        OnGameModeStarted();

        OnPlayerDeployed(aiPlayer as unknown as mod.Player);

        expect(modMock.AIMoveToBehavior).toHaveBeenCalledWith(aiPlayer, vector(202, 0, 0));
        expect(modMock.AIDefendPositionBehavior).not.toHaveBeenCalled();
    });

    it("periodically reissues objective orders to active AI so they do not stay on a friendly point", () => {
        const aiPlayer: FakePlayer = { id: 250, kind: "player", team: teams[1], ai: true };
        allPlayers = [aiPlayer];
        points[0].owner = teams[1];
        points[1].owner = teams[1];
        points[2].owner = teams[2];
        OnGameModeStarted();

        elapsed = 5;
        OngoingGlobal();

        expect(modMock.AIMoveToBehavior).toHaveBeenCalledWith(aiPlayer, vector(202, 0, 0));
    });
});
