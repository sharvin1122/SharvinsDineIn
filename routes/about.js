const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

function setFlash(req, type, message) {
    req.session.flash = { type, message };
}

router.get("/", (req, res) => {
    res.render("about", { SharvinsDineIn: "Sharvin's Dine In" });
});

router.post('/review', async (req, res) => {
    try {
        const rating = Number(req.body.rating);
        const message = String(req.body.message || '').trim();

        if (!rating || rating < 1 || rating > 5 || !message) {
            setFlash(req, 'danger', 'Please select a rating and write a review.');
            return res.redirect('/about');
        }

        await Review.create({
            user: req.session.user?.id && req.session.user.id !== 'admin' ? req.session.user.id : undefined,
            name: req.session.user?.full_name || 'Guest',
            email: req.session.user?.email || '',
            rating,
            message
        });

        setFlash(req, 'success', 'Thank you for your review.');
        res.redirect('/about');
    } catch (err) {
        console.error('Review error:', err);
        setFlash(req, 'danger', 'Review could not be saved.');
        res.redirect('/about');
    }
});

module.exports = router;
