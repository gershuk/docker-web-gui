exports.lightContainerDetail = (id, inspectedData) => {
  if (inspectedData && (inspectedData.Names || inspectedData.RunningFor)) {
    const rawName = inspectedData.Names || "";
    const name = Array.isArray(rawName) ? (rawName[0] || "") : rawName;
    const status = String(inspectedData.Status || "");
    const running = inspectedData.State === "running" || status.indexOf("Up") === 0;
    // docker ps emits the id under "ID" (uppercase), docker inspect under "Id".
    const containerId = inspectedData.ID || inspectedData.Id || id || "";
    return {
      Id: containerId,
      shortId: containerId ? containerId.slice(0, 12) : id,
      Created: inspectedData.CreatedAt,
      State: { Running: running },
      Name: String(name).replace("/", "")
    };
  }
  return {
    Id: inspectedData.Id,
    shortId: id,
    Created: inspectedData.Created,
    State: inspectedData.State,
    Name: inspectedData.Name.replace('/', '')
  };
};