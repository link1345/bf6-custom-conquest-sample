import * as modlib from "modlib";
import { createTicketHud } from "./AppleInFront";

export function OnPlayerJoinGame(eventPlayer: mod.Player) {
    modlib.ShowNotificationMessage(mod.Message(mod.stringkeys.hello, 1));
    createTicketHud(eventPlayer);
}
