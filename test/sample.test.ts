import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OnPlayerJoinGame } from '../mods/Script';
import { setupBfPortalMock, type BfPortalModMock, createFake } from "../test-support/bfportal-vitest-mock.generated";

import stringkeys from "../dist/Strings.json";

export let modMock: BfPortalModMock;

beforeEach(() => {
    vi.resetAllMocks();

    modMock = setupBfPortalMock({
        GetObjId: () => 100,
        CreateVector(x: number, y: number, z: number): mod.Vector {
            return { __test: true, x, y, z } as unknown as mod.Vector;
        },
        GetUIRoot(): mod.UIWidget {
            return { __test: true, name: "root" } as unknown as mod.UIWidget;
        },
        FindUIWidgetWithName(name: string): mod.UIWidget {
            return { __test: true, name } as unknown as mod.UIWidget;
        },
        Message(
            msg: string | number | mod.Player,
            msgArg0?: string | number | mod.Player,
            msgArg1?: string | number | mod.Player,
            msgArg2?: string | number | mod.Player,
        ): mod.Message {
            return {
                __test: true,
                msg,
                args: [msgArg0, msgArg1, msgArg2],
            } as unknown as mod.Message;
        },
    }, {
        stringkeys,
        UIAnchor: {
            Center: "Center",
            TopLeft: "TopLeft",
        } as unknown as typeof mod.UIAnchor,
        UIBgFill: {
            Blur: "Blur",
            None: "None",
            Solid: "Solid",
        } as unknown as typeof mod.UIBgFill,
        UIDepth: {
            AboveGameUI: "AboveGameUI",
        } as unknown as typeof mod.UIDepth,
    });
});

describe('OnPlayerJoinGame', () => {
    it('When a player joins the game, send a message', async () => {
        await OnPlayerJoinGame(createFake<mod.Player>());
        expect(modMock.DisplayNotificationMessage).toHaveBeenCalledWith({
            "__test": true,
            "args": [
                1,
                undefined,
                undefined,
            ],
            "msg": "Hello World {}",
        },);
    });
});
