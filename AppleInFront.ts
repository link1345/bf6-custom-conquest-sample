const HUD_WIDGET_PREFIX = "StaticTicketHud";
const HUD_TOTAL_TICKETS = 1500;
const HUD_TEAM_1_TICKETS = 1462;
const HUD_TEAM_2_TICKETS = 1483;
const HUD_TIME_LIMIT = "35 : 27";

const HUD_PANEL_POSITION = mod.CreateVector(18, 38, 0);
const HUD_PANEL_SIZE = mod.CreateVector(455, 72, 0);
const HUD_TEAM_1_COLOR = mod.CreateVector(0.0, 0.82, 1.0);
const HUD_TEAM_2_COLOR = mod.CreateVector(1.0, 0.12, 0.16);
const HUD_WHITE = mod.CreateVector(1.0, 1.0, 1.0);
const HUD_DARK = mod.CreateVector(0.0, 0.025, 0.055);
const HUD_MUTED = mod.CreateVector(0.35, 0.35, 0.35);

function hudName(player: mod.Player, suffix: string): string {
    return `${HUD_WIDGET_PREFIX}_${String(player)}_${suffix}`;
}

function getTicketBarWidth(tickets: number, maxWidth: number): number {
    return maxWidth * (tickets / HUD_TOTAL_TICKETS);
}

function deleteTicketHud(player: mod.Player): void {
    try {
        mod.DeleteUIWidget(mod.FindUIWidgetWithName(hudName(player, "Root")));
    } catch {
        console.log("StaticTicketHud: no previous HUD to delete");
    }
}

function addPanel(player: mod.Player): mod.UIWidget {
    mod.AddUIContainer(
        hudName(player, "Root"),
        HUD_PANEL_POSITION,
        HUD_PANEL_SIZE,
        mod.UIAnchor.TopLeft,
        mod.GetUIRoot(),
        true,
        0,
        HUD_DARK,
        0.78,
        mod.UIBgFill.Blur,
        mod.UIDepth.AboveGameUI,
        player
    );

    return mod.FindUIWidgetWithName(hudName(player, "Root"), mod.GetUIRoot());
}

function addContainer(
    player: mod.Player,
    parent: mod.UIWidget,
    suffix: string,
    position: mod.Vector,
    size: mod.Vector,
    color: mod.Vector,
    alpha: number,
    fill: mod.UIBgFill = mod.UIBgFill.Solid
): void {
    mod.AddUIContainer(
        hudName(player, suffix),
        position,
        size,
        mod.UIAnchor.TopLeft,
        parent,
        true,
        0,
        color,
        alpha,
        fill,
        mod.UIDepth.AboveGameUI,
        player
    );
}

function addText(
    player: mod.Player,
    parent: mod.UIWidget,
    suffix: string,
    position: mod.Vector,
    size: mod.Vector,
    message: string | number,
    textSize: number,
    textColor: mod.Vector,
    textAnchor: mod.UIAnchor = mod.UIAnchor.Center,
    bgColor: mod.Vector = HUD_DARK,
    bgAlpha: number = 0,
    bgFill: mod.UIBgFill = mod.UIBgFill.None
): void {
    mod.AddUIText(
        hudName(player, suffix),
        position,
        size,
        mod.UIAnchor.TopLeft,
        parent,
        true,
        0,
        bgColor,
        bgAlpha,
        bgFill,
        mod.Message(message),
        textSize,
        textColor,
        1,
        textAnchor,
        mod.UIDepth.AboveGameUI,
        player
    );
}

function addObjectiveBox(
    player: mod.Player,
    parent: mod.UIWidget,
    suffix: string,
    label: string,
    x: number,
    bgColor: mod.Vector,
    textColor: mod.Vector = HUD_WHITE
): void {
    addText(
        player,
        parent,
        suffix,
        mod.CreateVector(x, 49, 0),
        mod.CreateVector(18, 18, 0),
        label,
        14,
        textColor,
        mod.UIAnchor.Center,
        bgColor,
        0.92,
        mod.UIBgFill.Solid
    );
}

function createTicketHud(player: mod.Player): void {
    deleteTicketHud(player);

    const root = addPanel(player);
    const barMaxWidth = 120;
    const team1BarWidth = getTicketBarWidth(HUD_TEAM_1_TICKETS, barMaxWidth);
    const team2BarWidth = getTicketBarWidth(HUD_TEAM_2_TICKETS, barMaxWidth);

    addText(
        player,
        root,
        "Team1Tickets",
        mod.CreateVector(5, 7, 0),
        mod.CreateVector(55, 28, 0),
        HUD_TEAM_1_TICKETS,
        18,
        HUD_TEAM_1_COLOR
    );
    addContainer(
        player,
        root,
        "Team1BarBack",
        mod.CreateVector(72, 17, 0),
        mod.CreateVector(barMaxWidth, 8, 0),
        HUD_MUTED,
        0.35
    );
    addContainer(
        player,
        root,
        "Team1Bar",
        mod.CreateVector(72, 17, 0),
        mod.CreateVector(team1BarWidth, 8, 0),
        HUD_TEAM_1_COLOR,
        1
    );

    addText(
        player,
        root,
        "TimeLimit",
        mod.CreateVector(202, 5, 0),
        mod.CreateVector(55, 30, 0),
        HUD_TIME_LIMIT,
        16,
        HUD_WHITE,
        mod.UIAnchor.Center,
        HUD_DARK,
        0.75,
        mod.UIBgFill.Solid
    );

    addContainer(
        player,
        root,
        "Team2BarBack",
        mod.CreateVector(270, 17, 0),
        mod.CreateVector(barMaxWidth, 8, 0),
        HUD_MUTED,
        0.35
    );
    addContainer(
        player,
        root,
        "Team2Bar",
        mod.CreateVector(270 + (barMaxWidth - team2BarWidth), 17, 0),
        mod.CreateVector(team2BarWidth, 8, 0),
        HUD_TEAM_2_COLOR,
        1
    );
    addText(
        player,
        root,
        "Team2Tickets",
        mod.CreateVector(397, 7, 0),
        mod.CreateVector(55, 28, 0),
        HUD_TEAM_2_TICKETS,
        18,
        HUD_TEAM_2_COLOR
    );

    addObjectiveBox(player, root, "ObjectiveA", "A", 176, HUD_TEAM_1_COLOR);
    addObjectiveBox(player, root, "ObjectiveB", "B", 205, HUD_MUTED);
    addObjectiveBox(player, root, "ObjectiveC", "C", 234, HUD_TEAM_2_COLOR);
}

export function OnGameModeStarted(): void {
    console.log("StaticTicketHud: OnGameModeStarted");
    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    console.log("StaticTicketHud: OnPlayerDeployed");
    createTicketHud(eventPlayer);
}
