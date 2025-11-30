export const fetchSearchUsers = (term: string) => {
  const accessToken = localStorage.getItem("arena-access-token")
  return fetch(`/api/searchUsers?q=${encodeURIComponent(term)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const fetchUserChannels = async (userId: number) => {
  const accessToken = localStorage.getItem("arena-access-token")
  return fetch(`/api/getUserChannels?userId=${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const fetchChannelContents = async (channelId: number, page: number = 1, per: number = 52) => {
  const accessToken = localStorage.getItem("arena-access-token")
  return fetch(`/api/getChannelContents?channelId=${channelId}&page=${page}&per=${per}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const fetchSearchChannels = (term: string) => {
  const accessToken = localStorage.getItem("arena-access-token")
  return fetch(`/api/searchChannels?q=${encodeURIComponent(term)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
};