const { safeTerminal } = require("../utilities/terminal");

exports.GenericCommandController = async (req, res, next) => {
  try {
    const output = await safeTerminal.containerLs();
    const filtered = output.replace(/}\s*{/g, "},{");
    res.json(filtered);
  } catch (error) {
    next(error);
  }
};
