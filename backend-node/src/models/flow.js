const mongoose = require('mongoose');

const flowSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    founder_name: {
        type: String,
        required: true,
        trim: true
    },
    company_name: {
        type: String,
        required: true,
        trim: true
    },
    deep_research: {
        type: String,
        default: ''
    },
    interview_transcript: {
        type: String,
        default: ''
    },
    tone: {
        type: String,
        default: 'Professional',
        trim: true
    },
    gumloopResponse: {
        run_id: String,
        state: {
            type: String,
            enum: ['RUNNING', 'COMPLETED', 'FAILED'],
            default: 'RUNNING'
        },
        url: String
    },
    subflowVersion: {
        type: [Object],
        default: []
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Flow', flowSchema);