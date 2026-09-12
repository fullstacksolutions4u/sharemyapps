const feedService = require('../services/feed.service');
const FeedDto = require('../dtos/feed.dto');

exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 40;
    
    const result = await feedService.getFeed(req.user, page, limit);
    
    res.json({
      success: true,
      data: result.activities,
      page,
      hasMore: result.hasMore
    });
  } catch (error) {
    next(error);
  }
};

exports.likeActivity = async (req, res, next) => {
  try {
    const likes = await feedService.likeActivity(req.params.id, req.user._id);
    res.json({ success: true, likes });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

exports.commentActivity = async (req, res, next) => {
  try {
    const data = FeedDto.validateComment(req.body);
    const comment = await feedService.commentActivity(req.params.id, req.user._id, data.text);
    res.json({ success: true, comment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};
