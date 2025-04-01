export class Leaderboard {
    constructor() {
        this.scores = this.loadScores();
        this.maxScores = 5;
    }

    loadScores() {
        const savedScores = localStorage.getItem('snakeHighScores');
        if (savedScores) {
            try {
                const scores = JSON.parse(savedScores);
                // Filter out any invalid or undefined scores
                const validScores = scores.filter(entry =>
                    entry &&
                    typeof entry.score === 'number' &&
                    !isNaN(entry.score) &&
                    entry.date
                );
                const uniqueScores = this.getUniqueScores(validScores);
                return uniqueScores;
            } catch (e) {
                console.error('Error loading scores:', e);
                return [];
            }
        }
        return [];
    }

    getUniqueScores(scores) {
        // Create a map using score as key to keep only the latest entry for each score
        const scoreMap = new Map();
        scores.forEach(entry => {
            if (!scoreMap.has(entry.score) ||
                new Date(entry.date) > new Date(scoreMap.get(entry.score).date)) {
                scoreMap.set(entry.score, entry);
            }
        });

        // Convert back to array, sort by score, and limit to maxScores
        return Array.from(scoreMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, this.maxScores);
    }

    saveScores() {
        try {
            // Clean and ensure scores are valid before saving
            const cleanScores = this.getUniqueScores(this.scores);
            localStorage.setItem('snakeHighScores', JSON.stringify(cleanScores));
        } catch (e) {
            console.error('Error saving scores:', e);
        }
    }

    addScore(score) {
        // Only add valid scores
        if (typeof score !== 'number' || isNaN(score)) {
            return 0;
        }

        const date = new Date().toLocaleDateString();
        const newScore = { score, date };

        this.scores.push(newScore);
        this.scores = this.getUniqueScores(this.scores);
        this.saveScores();

        return this.getScoreRank(score);
    }

    getScoreRank(score) {
        return this.scores.findIndex(s => s.score === score) + 1;
    }

    isHighScore(score) {
        // Check if score would make it into top 5
        if (this.scores.length < this.maxScores) {
            return true;
        }
        // Check if score is higher than the lowest score
        const lowestScore = this.scores[this.scores.length - 1]?.score || 0;
        return score > lowestScore;
    }

    getHighScores() {
        return this.scores;
    }

    clearScores() {
        this.scores = [];
        localStorage.removeItem('snakeHighScores');
    }
}