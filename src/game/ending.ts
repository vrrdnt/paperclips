import { message } from '../i18n/message';
/** In order of appearance; also used to restore credits after reloading. */
export const ENDING_CREDITS = [
  message("gameLayout.universalPaperclips"),
  message("log.aGameByFrankLantz"),
  message("log.combatProgrammingByBennettFoddy"),
  message("log.riversongByTontoSExpandingHeadbandUsedBy"),
  message("log.2017EverybodyHouseGames"),
] as const;
