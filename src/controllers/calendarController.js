const Calendar = require("../models/calendarModel");

exports.blockDateSession = async (req, res) => {
  try {
    const { date, session } = req.body;

    // Create a new calendar entry
    const calendarEntry = new Calendar({ date, session, status: "blocked" });

    await calendarEntry.save();
    res
      .status(201)
      .json({ message: "Date and session blocked successfully", entry: calendarEntry });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a blocked date and session
exports.updateBlockedDateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, session } = req.body;
    const updatedEntry = await Calendar.findByIdAndUpdate(
      id,
      { date, session, status: "blocked" },
      { new: true, runValidators: true },
    );

    if (!updatedEntry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(200).json({ message: "Date and session updated successfully", entry: updatedEntry });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a blocked date and session
exports.deleteBlockedDateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEntry = await Calendar.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(200).json({ message: "Date and session deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
