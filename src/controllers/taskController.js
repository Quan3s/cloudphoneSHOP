// src/controllers/taskController.js

exports.htnvCallback = async (req, res) => {
    try {
        const { uid } = req.query; // Giả sử bên Link4M trả về UID người dùng
        if (!uid) return res.send("Thiếu thông tin người dùng!");

        const today = new Date().toISOString().split('T')[0];
        const key = `task:${uid}:${today}`;

        // 1. Kiểm tra giới hạn (Senior Logic)
        const count = await redis.get(key) || 0;
        if (parseInt(count) >= 4) {
            return res.send("Bạn đã đạt giới hạn nhiệm vụ hôm nay!");
        }

        // 2. Cộng xu vào Redis
        await redis.incr(key); // Tăng lượt làm trong ngày
        await redis.incrby(`balance:${uid}`, 30); // Cộng 30 xu

        // 3. ĐÂY LÀ CHỖ ĐẶT DÒNG REDIRECT
        // Sau khi cộng tiền xong, chuyển hướng người dùng về trang chủ kèm trạng thái thành công
        res.redirect(`https://cloudphoneshop.onrender.com/?status=task_done`);

    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi xử lý nhiệm vụ");
    }
};
