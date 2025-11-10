/**
 * Riot Games API - Account-V1 DTOs
 * 
 * Documentation: https://developer.riotgames.com/apis#account-v1
 */

/**
 * Account DTO - Response from GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
 */
export interface AccountDto {
  /** Encrypted PUUID. Exact length of 78 characters. */
  puuid: string;
  /** Game name */
  gameName: string;
  /** Tag line */
  tagLine: string;
}

/**
 * Account DTO - Response from GET /riot/account/v1/accounts/by-puuid/{puuid}
 */
export interface AccountByPuuidDto {
  /** Encrypted PUUID. Exact length of 78 characters. */
  puuid: string;
  /** Game name */
  gameName: string;
  /** Tag line */
  tagLine: string;
}

