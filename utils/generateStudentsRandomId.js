export const generateStudentsRandomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let studentsRandomId = '';
    for (let i = 0; i < 9; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        studentsRandomId += characters[randomIndex];
    }
    return studentsRandomId;
}
