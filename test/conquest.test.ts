import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    OnCapturePointCaptured,
    OnGameModeStarted,
    OnPlayerDied,
    OnPlayerEarnedKill,
    OnPlayerJoinGame,
    OngoingCapturePoint,
    OngoingGlobal,
} from "../mods/Script";
import { setupBfPortalMock, type BfPortalModMock } from "../test-support/bfportal-vitest-mock.generated";
import stringkeys from "../dist/Strings.json";

type FakeTeam = { id: number; kind: "team" };
type FakePoint = { id: number; kind: "point"; owner: FakeTeam; progressOwner: FakeTeam; progress: number; players: FakePlayer[] };
type FakePlayer = { id: number; kind: "player"; team: FakeTeam; ai?: boolean };
type FakeWidget = { name: string; position?: mod.Vector; size?: mod.Vector };

const teams: Record<number, FakeTeam> = {
    0: { id: 0, kind: "team" },
    1: { id: 1, kind: "team" },
    2: { id: 2, kind: "team" },
};

let points: FakePoint[];
let widgets: Map<string, FakeWidget>;
let variables: Map<string, unknown>;
let elapsed: number;
let remaining: number;
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
    elapsed = 0;
    remaining = 2700;
    points = [
        { id: 200, kind: "point", owner: teams[1], progressOwner: teams[1], progress: 1, players: [] },
        { id: 201, kind: "point", owner: teams[1], progressOwner: teams[1], progress: 1, players: [] },
        { id: 202, kind: "point", owner: teams[2], progressOwner: teams[2], progress: 1, players: [] },
    ];

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
            AIBattlefieldBehavior: (() => undefined) as typeof mod.AIBattlefieldBehavior,
            AIMoveToBehavior: (() => undefined) as typeof mod.AIMoveToBehavior,
            AISetMoveSpeed: (() => undefined) as typeof mod.AISetMoveSpeed,
            AISetTarget: (() => undefined) as typeof mod.AISetTarget,
            AllCapturePoints: () => asModArray(points),
            AllPlayers: () => asModArray([]),
            CountOf: (array: mod.Array) => (array as unknown as unknown[]).length,
            CreateVector: vector,
            DeleteUIWidget: ((widget: FakeWidget) => widgets.delete(widget.name)) as unknown as typeof mod.DeleteUIWidget,
            DistanceBetween: () => 10,
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
            GetObjectPosition: (() => vector(0, 0, 0)) as typeof mod.GetObjectPosition,
            GetOwnerProgressTeam: (point: mod.CapturePoint) => (point as unknown as FakePoint).progressOwner as unknown as mod.Team,
            GetPlayersOnPoint: (point: mod.CapturePoint) => asModArray((point as unknown as FakePoint).players),
            GetSpawner: ((id: number) => ({ id, kind: "spawner" })) as unknown as typeof mod.GetSpawner,
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
            PlayVO: (() => undefined) as typeof mod.PlayVO,
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
            SetUITextColor: (() => undefined) as typeof mod.SetUITextColor,
            SetUITextLabel: (() => undefined) as typeof mod.SetUITextLabel,
            SetUIWidgetBgColor: (() => undefined) as typeof mod.SetUIWidgetBgColor,
            SetUIWidgetBgFill: (() => undefined) as typeof mod.SetUIWidgetBgFill,
            SetUIWidgetDepth: (() => undefined) as typeof mod.SetUIWidgetDepth,
            SetUIWidgetPosition: vi.fn((widget: FakeWidget, position: mod.Vector) => {
                widget.position = position;
            }) as unknown as typeof mod.SetUIWidgetPosition,
            SetUIWidgetSize: vi.fn((widget: FakeWidget, size: mod.Vector) => {
                widget.size = size;
            }) as unknown as typeof mod.SetUIWidgetSize,
            SetUIWidgetVisible: (() => undefined) as typeof mod.SetUIWidgetVisible,
            SetUnspawnDelayInSeconds: (() => undefined) as typeof mod.SetUnspawnDelayInSeconds,
            SetVariable: ((variable: mod.Variable, value: unknown) => {
                variables.set(String(variable), value);
            }) as typeof mod.SetVariable,
            SetVehicleCategoryAllowedInSurroundingArea: (() => undefined) as typeof mod.SetVehicleCategoryAllowedInSurroundingArea,
            SetVehicleSpawnerAutoSpawn: (() => undefined) as typeof mod.SetVehicleSpawnerAutoSpawn,
            SpawnAIFromAISpawner: vi.fn(() => undefined) as unknown as typeof mod.SpawnAIFromAISpawner,
            SpawnObject: ((spawn: unknown) => ({ id: objId(spawn), kind: "spawned" })) as typeof mod.SpawnObject,
            ValueInArray: (array: mod.Array, index: number) => (array as unknown as unknown[])[index],
        },
        {
            stringkeys,
            Gadgets: { Mask_NVG: "Mask_NVG" } as unknown as typeof mod.Gadgets,
            MoveSpeed: { InvestigateRun: "InvestigateRun" } as unknown as typeof mod.MoveSpeed,
            MusicEvents: {
                Core_EndOfRound_Loop: "Core_EndOfRound_Loop",
                Core_LastPhaseBegin: "Core_LastPhaseBegin",
                Core_Overtime_Loop: "Core_Overtime_Loop",
            } as unknown as typeof mod.MusicEvents,
            MusicPackages: { Core: "Core" } as unknown as typeof mod.MusicPackages,
            MusicParams: { Core_IsWinning: "Core_IsWinning" } as unknown as typeof mod.MusicParams,
            RuntimeSpawn_Common: { SFX_VOModule_OneShot2D: 1 } as unknown as typeof mod.RuntimeSpawn_Common,
            ScoreboardType: { CustomTwoTeams: "CustomTwoTeams" } as unknown as typeof mod.ScoreboardType,
            SoldierStateBool: { IsAISoldier: "IsAISoldier" } as unknown as typeof mod.SoldierStateBool,
            UIAnchor: { Center: "Center", TopCenter: "TopCenter" } as unknown as typeof mod.UIAnchor,
            UIBgFill: { Blur: "Blur", None: "None", Solid: "Solid" } as unknown as typeof mod.UIBgFill,
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
    it("sets up conquest rules, capture points, scoreboard, and HUD on game start", () => {
        OnGameModeStarted();

        expect(modMock.SetGameModeTimeLimit).toHaveBeenCalledWith(2700);
        expect(modMock.SetGameModeTargetScore).toHaveBeenCalledWith(10000);
        expect(modMock.SetCapturePointCapturingTime).toHaveBeenCalledTimes(3);
        expect(modMock.SetCapturePointNeutralizationTime).toHaveBeenCalledTimes(3);
        expect(modMock.SetScoreboardType).toHaveBeenCalledWith(mod.ScoreboardType.CustomTwoTeams);
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

    it("does not auto-spawn custom AI by default", () => {
        OnGameModeStarted();
        elapsed = 1;

        OngoingGlobal();

        expect(modMock.SpawnAIFromAISpawner).not.toHaveBeenCalled();
    });

    it("updates objective HUD progress without reading widget positions", () => {
        OnGameModeStarted();

        OngoingCapturePoint(points[0] as unknown as mod.CapturePoint);

        expect(modMock.GetUIWidgetPosition).not.toHaveBeenCalled();
    });
});
