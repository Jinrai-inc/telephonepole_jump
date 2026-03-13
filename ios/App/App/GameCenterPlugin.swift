import Capacitor
import GameKit

@objc(GameCenterPlugin)
public class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameCenterPlugin"
    public let jsName = "GameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboard", returnType: CAPPluginReturnPromise),
    ]

    @objc func signIn(_ call: CAPPluginCall) {
        let localPlayer = GKLocalPlayer.local
        localPlayer.authenticateHandler = { [weak self] viewController, _ in
            if let vc = viewController {
                DispatchQueue.main.async {
                    self?.bridge?.viewController?.present(vc, animated: true)
                }
            } else if localPlayer.isAuthenticated {
                call.resolve([
                    "isAuthenticated": true,
                    "playerID": localPlayer.gamePlayerID,
                    "displayName": localPlayer.displayName,
                ])
            } else {
                call.resolve(["isAuthenticated": false])
            }
        }
    }

    @objc func submitScore(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else {
            call.resolve(["submitted": false])
            return
        }
        guard let leaderboardID = call.getString("leaderboardID"),
              let score = call.getInt("score") else {
            call.reject("Missing leaderboardID or score")
            return
        }
        if #available(iOS 14.0, *) {
            GKLeaderboard.submitScore(
                score, context: 0,
                player: GKLocalPlayer.local,
                leaderboardIDs: [leaderboardID]
            ) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve(["submitted": true])
                }
            }
        } else {
            let gkScore = GKScore(leaderboardIdentifier: leaderboardID)
            gkScore.value = Int64(score)
            GKScore.report([gkScore]) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve(["submitted": true])
                }
            }
        }
    }

    @objc func showLeaderboard(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else {
            call.resolve(["shown": false])
            return
        }
        let leaderboardID = call.getString("leaderboardID")
        DispatchQueue.main.async { [weak self] in
            let vc: GKGameCenterViewController
            if let lid = leaderboardID, #available(iOS 14.0, *) {
                vc = GKGameCenterViewController(
                    leaderboardID: lid,
                    playerScope: .global,
                    timeScope: .allTime
                )
            } else {
                vc = GKGameCenterViewController(state: .leaderboards)
            }
            vc.gameCenterDelegate = self
            self?.bridge?.viewController?.present(vc, animated: true)
        }
        call.resolve(["shown": true])
    }
}

extension GameCenterPlugin: GKGameCenterControllerDelegate {
    public func gameCenterViewControllerDidFinish(_ vc: GKGameCenterViewController) {
        vc.dismiss(animated: true)
    }
}
