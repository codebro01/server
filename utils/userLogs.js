export const addLogToUser = async (Model, userId, action, ip = null, metadata = {}) => {
  try {
    const user = await Model.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Add a new log entry to the user's logs array
    user.logs.push({ action, ip, metadata });
    await user.save();

    console.log('Log added successfully');
  } catch (error) {
    console.error('Error adding log:', error.message);
  }
};

export const getUserLogs = async (userId) => {
  try {
    const user = await Model.findById(userId).select('logs');
    if (!user) {
      throw new Error('User not found');
    }

    console.log('User Logs:', user.logs);
    return user.logs;
  } catch (error) {
    console.error('Error retrieving logs:', error.message);
  }
};

// Usage example:
// getUserLogs('USER_ID_HERE');