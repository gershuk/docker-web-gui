const { safeTerminal } = require("../utilities/terminal");
const { lightContainerDetail } = require("../utilities/lightContainerDetail");

// Simple in-memory cache with TTL.
const cache = {};

const getCached = (key) => {
  const entry = cache[key];
  return entry && entry.expires > Date.now() ? entry.value : null;
};

const setCached = (key, value, ttlMs) => {
  cache[key] = { value, expires: Date.now() + (ttlMs || 5000) };
};

const invalidateContainersCache = () => {
  const keys = Object.keys(cache).filter((key) => key.indexOf("container:") === 0);
  keys.forEach((key) => delete cache[key]);
};

// Fetch the full container list once and share it across status segments,
// so switching between All/Active/Stopped is instant (no repeated docker ps).
const fetchAllContainers = async () => {
  const cached = getCached("container:all");
  if (cached) return cached;

  const rawContainersFromCmd = await safeTerminal.allContainersWithDetails();
  const containers = rawContainersFromCmd
    .split("\n")
    .map((container) => container.trim())
    .filter((container) => container !== "");

  const results = [];
  for (const containerRow of containers) {
    let parsed;
    try {
      parsed = JSON.parse(containerRow);
    } catch (e) {
      continue;
    }
    results.push(lightContainerDetail(parsed.ID || parsed.Id, parsed));
  }

  const sorted = results.sort((a, b) => (a.Name > b.Name ? 1 : -1));
  setCached("container:all", sorted, 5000);
  return sorted;
};

exports.fetchContainers = async (status) => {
  const all = await fetchAllContainers();

  if (status === "active") {
    return all.filter((c) => c.State.Running === true);
  }
  if (status === "stopped") {
    return all.filter((c) => c.State.Running !== true);
  }
  return all;
};

exports.fetch = async (req, res, next) => {
  try {
    const status = req.query.status ? req.query.status : "active";
    const results = await exports.fetchContainers(status);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

exports.fetchById = async (req, res, next) => {
  try {
    const containerID = req.query.container;
    const containerInspect = await safeTerminal.inspectContainer(containerID);
    const container = lightContainerDetail(
      containerID,
      JSON.parse(containerInspect)[0]
    );
    res.json(container);
  } catch (error) {
    next(error);
  }
};

exports.command = async (req, res, next) => {
  const containerID = req.query.container;
  const command = req.query.command;
  try {
    const cmdData = await safeTerminal.generic(command, containerID);
    // Invalidate caches after a state-changing command.
    invalidateContainersCache();
    res.json(cmdData.replace("\n", ""));
  } catch (error) {
    next(error);
  }
};

exports.logs = async (req, res, next) => {
  try {
    const containerID = req.query.container;
    const data = await safeTerminal.logs(containerID);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.stats = async (req, res, next) => {
  try {
    // Docker stats are heavy (~2.5s). Serve a 2.5s cached copy so the 10s
    // polling interval and rapid tab switches don't each trigger a docker call.
    const cached = getCached("stats");
    if (cached) {
      res.json(cached);
      return;
    }

    const cmdStats = await safeTerminal.stats();
    const statsArray = cmdStats
      .split("\n")
      .filter((container) => container !== "")
      .map((stat) => JSON.parse(stat));
    setCached("stats", statsArray, 2500);
    res.json(statsArray);
  } catch (error) {
    next(error);
  }
};