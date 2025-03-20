import { LcUserInTgChatSelect, LcUserSelect, SubmissionSelect } from "../../lc-users";
import { LcChatSettingsSelect, TgChatSelect, TgUserSelect } from "../../tg";
import { LcProblemSelect } from "../LcProblemsDao";

export interface LcRecentAcceptedSubmissions {
  recentAcSubmissionList: {
    id: string
    title: string
    titleSlug: string
    timestamp: string
  }[]
}


export interface LcPullSubmissionJob {
  submission: LcRecentAcceptedSubmissions['recentAcSubmissionList'][number]
  tgUser: TgUserSelect
  lcUser: LcUserSelect
}
