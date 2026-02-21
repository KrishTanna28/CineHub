import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Compound index: one entry per query per user, fast lookups
searchHistorySchema.index({ user: 1, query: 1 });
// For ordering by most recent
searchHistorySchema.index({ user: 1, createdAt: -1 });

const SearchHistory = mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
