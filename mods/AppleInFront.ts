const HUD_WIDGET_PREFIX = "StaticTicketHud";
const HUD_TOTAL_TICKETS = 1500;
const HUD_TEAM_1_TICKETS = 1462;
const HUD_TEAM_2_TICKETS = 1483;
const HUD_TIME_LIMIT = "35 : 27";

function hudPanelPosition(): mod.Vector {
    return mod.CreateVector(18, 38, 0);
}

function hudPanelSize(): mod.Vector {
    return mod.CreateVector(455, 72, 0);
}

function hudTeam1Color(): mod.Vector {
    return mod.CreateVector(0.0, 0.82, 1.0);
}

function hudTeam2Color(): mod.Vector {
    return mod.CreateVector(1.0, 0.12, 0.16);
}

function hudWhite(): mod.Vector {
    return mod.CreateVector(1.0, 1.0, 1.0);
}

function hudDark(): mod.Vector {
    return mod.CreateVector(0.0, 0.025, 0.055);
}

function hudMuted(): mod.Vector {
    return mod.CreateVector(0.35, 0.35, 0.35);
}

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
        hudPanelPosition(),
        hudPanelSize(),
        mod.UIAnchor.TopLeft,
        mod.GetUIRoot(),
        true,
        0,
        hudDark(),
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
    bgColor?: mod.Vector,
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
        bgColor ?? hudDark(),
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
    textColor?: mod.Vector
): void {
    addText(
        player,
        parent,
        suffix,
        mod.CreateVector(x, 49, 0),
        mod.CreateVector(18, 18, 0),
        label,
        14,
        textColor ?? hudWhite(),
        mod.UIAnchor.Center,
        bgColor,
        0.92,
        mod.UIBgFill.Solid
    );
}

export function createTicketHud(player: mod.Player): void {
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
        hudTeam1Color()
    );
    addContainer(
        player,
        root,
        "Team1BarBack",
        mod.CreateVector(72, 17, 0),
        mod.CreateVector(barMaxWidth, 8, 0),
        hudMuted(),
        0.35
    );
    addContainer(
        player,
        root,
        "Team1Bar",
        mod.CreateVector(72, 17, 0),
        mod.CreateVector(team1BarWidth, 8, 0),
        hudTeam1Color(),
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
        hudWhite(),
        mod.UIAnchor.Center,
        hudDark(),
        0.75,
        mod.UIBgFill.Solid
    );

    addContainer(
        player,
        root,
        "Team2BarBack",
        mod.CreateVector(270, 17, 0),
        mod.CreateVector(barMaxWidth, 8, 0),
        hudMuted(),
        0.35
    );
    addContainer(
        player,
        root,
        "Team2Bar",
        mod.CreateVector(270 + (barMaxWidth - team2BarWidth), 17, 0),
        mod.CreateVector(team2BarWidth, 8, 0),
        hudTeam2Color(),
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
        hudTeam2Color()
    );

    addObjectiveBox(player, root, "ObjectiveA", "A", 176, hudTeam1Color());
    addObjectiveBox(player, root, "ObjectiveB", "B", 205, hudMuted());
    addObjectiveBox(player, root, "ObjectiveC", "C", 234, hudTeam2Color());
}

export function OnGameModeStarted(): void {
    console.log("StaticTicketHud: OnGameModeStarted");
    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    console.log("StaticTicketHud: OnPlayerDeployed");
    createTicketHud(eventPlayer);
}
