const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  fullName: { type: DataTypes.STRING(120), allowNull: false },
  preferredCity: { type: DataTypes.STRING(90), allowNull: true },
  bio: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '' },
  avatarUrl: { type: DataTypes.TEXT('medium'), allowNull: true },
  showCity: {type:DataTypes.BOOLEAN,allowNull:false,defaultValue:false},
  isPrivate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  interests: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  musicGenres: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  musicArtists: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  cnpj: { type: DataTypes.STRING(14), allowNull: true, unique: true },
  isOrganizer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'users' });

const Venue = sequelize.define('Venue', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(130), allowNull: false },
  city: { type: DataTypes.STRING(90), allowNull: false },
  state: { type: DataTypes.STRING(2), allowNull: false },
  address: { type: DataTypes.STRING(255), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true }
}, { tableName: 'venues' });

const Event = sequelize.define('Event', {
  organizerId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.ENUM('cinema','shows','baladas','teatro','danca','cultura'), allowNull: false },
  startAt: { type: DataTypes.DATE, allowNull: false },
  endAt: { type: DataTypes.DATE, allowNull: true },
  genres: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  performers: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  accent: { type: DataTypes.STRING(30), allowNull: true },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'events' });

const TicketLot = sequelize.define('TicketLot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(60), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  available: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } }
}, { tableName: 'ticket_lots' });

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('DEMO','CANCELLED','PENDING','CONFIRMED'), allowNull: false, defaultValue: 'DEMO' }
}, { tableName: 'orders' });

const Ticket = sequelize.define('Ticket', {
  code: { type: DataTypes.UUID, allowNull: false, unique: true },
  checkedAt: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'tickets' });
Order.hasMany(Ticket, { as: 'tickets', foreignKey: { name: 'orderId', allowNull: false } });
Ticket.belongsTo(Order, { as: 'order', foreignKey: { name: 'orderId', allowNull: false } });
const Payment = sequelize.define('Payment', {
  requestKey: { type: DataTypes.UUID, allowNull: false },
  sessionId: { type: DataTypes.STRING, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'payments', indexes: [{unique:true,fields:['user_id','request_key']}] });
Payment.belongsTo(Order, {as:'order',foreignKey:{name:'orderId',allowNull:false,unique:true}});
Payment.belongsTo(User, {foreignKey:{name:'userId',allowNull:false}});
const Favorite=sequelize.define('Favorite',{
  id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true}
},{tableName:'favorites',indexes:[{unique:true,fields:['user_id','event_id']}]});
User.hasMany(Favorite,{foreignKey:{name:'userId',allowNull:false},as:'favorites'});
Favorite.belongsTo(User,{foreignKey:{name:'userId',allowNull:false},as:'user'});
Event.hasMany(Favorite,{foreignKey:{name:'eventId',allowNull:false},as:'favorites'});
Favorite.belongsTo(Event,{foreignKey:{name:'eventId',allowNull:false},as:'event'});

Venue.hasMany(Event, { foreignKey: { name: 'venueId', allowNull: false }, as: 'events' });
Event.belongsTo(Venue, { foreignKey: { name: 'venueId', allowNull: false }, as: 'venue' });
Event.hasMany(TicketLot, { foreignKey: { name: 'eventId', allowNull: false }, as: 'lots' });
TicketLot.belongsTo(Event, { foreignKey: { name: 'eventId', allowNull: false }, as: 'event' });
User.hasMany(Order, { foreignKey: { name: 'userId', allowNull: false }, as: 'orders' });
Order.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });
Event.hasMany(Order, { foreignKey: { name: 'eventId', allowNull: false }, as: 'orders' });
Order.belongsTo(Event, { foreignKey: { name: 'eventId', allowNull: false }, as: 'event' });
TicketLot.hasMany(Order, { foreignKey: { name: 'ticketLotId', allowNull: false }, as: 'orders' });
Order.belongsTo(TicketLot, { foreignKey: { name: 'ticketLotId', allowNull: false }, as: 'lot' });


// As novas entidades respeitam os modelos existentes; nenhuma tabela original é removida.
const State=sequelize.define('State',{
  id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
  ibgeId:{type:DataTypes.INTEGER,allowNull:false,unique:true},
  uf:{type:DataTypes.STRING(2),allowNull:false,unique:true},
  name:{type:DataTypes.STRING(90),allowNull:false}
},{tableName:'states'});
const City=sequelize.define('City',{
  id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
  ibgeId:{type:DataTypes.INTEGER,allowNull:false,unique:true},
  name:{type:DataTypes.STRING(100),allowNull:false}
},{tableName:'cities',indexes:[{fields:['name']}]});
State.hasMany(City,{foreignKey:{name:'stateId',allowNull:false},as:'cities'});
City.belongsTo(State,{foreignKey:{name:'stateId',allowNull:false},as:'state'});

const Post=sequelize.define('Post',{
  id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
  caption:{type:DataTypes.STRING(2000),allowNull:false},
  imageUrl:{type:DataTypes.TEXT('medium'),allowNull:true}
},{tableName:'posts'});
const PostLike=sequelize.define('PostLike',{id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true}},
 {tableName:'post_likes',indexes:[{unique:true,fields:['post_id','user_id']}]});
const PostComment=sequelize.define('PostComment',{
  id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
  content:{type:DataTypes.STRING(600),allowNull:false}
},{tableName:'post_comments'});
const UserFollow=sequelize.define('UserFollow',{id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true}},
 {tableName:'user_follows',indexes:[{unique:true,fields:['follower_id','following_id']}]});
const UserBlock=sequelize.define('UserBlock',{id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true}},
 {tableName:'user_blocks',indexes:[{unique:true,fields:['blocker_id','blocked_id']}]});
const PostReport=sequelize.define('PostReport',{
  id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},
  reason:{type:DataTypes.STRING(300),allowNull:false},
  status:{type:DataTypes.ENUM('OPEN','DISMISSED','REMOVED'),defaultValue:'OPEN',allowNull:false}
},{tableName:'post_reports',indexes:[{unique:true,fields:['post_id','reporter_id']}]});
User.hasMany(Post,{foreignKey:{name:'authorId',allowNull:false},as:'posts'});
Post.belongsTo(User,{foreignKey:{name:'authorId',allowNull:false},as:'author'});
Event.hasMany(Post,{foreignKey:{name:'eventId',allowNull:true},as:'posts'});
Post.belongsTo(Event,{foreignKey:{name:'eventId',allowNull:true},as:'event'});
Post.hasMany(PostLike,{foreignKey:{name:'postId',allowNull:false},as:'likes',onDelete:'CASCADE'});
PostLike.belongsTo(Post,{foreignKey:{name:'postId',allowNull:false},as:'post'});
PostLike.belongsTo(User,{foreignKey:{name:'userId',allowNull:false},as:'user'});
Post.hasMany(PostComment,{foreignKey:{name:'postId',allowNull:false},as:'comments',onDelete:'CASCADE'});
PostComment.belongsTo(Post,{foreignKey:{name:'postId',allowNull:false},as:'post'});
PostComment.belongsTo(User,{foreignKey:{name:'authorId',allowNull:false},as:'author'});
User.hasMany(UserFollow,{foreignKey:{name:'followerId',allowNull:false},as:'following'});
UserFollow.belongsTo(User,{foreignKey:{name:'followerId',allowNull:false},as:'follower'});
User.hasMany(UserFollow,{foreignKey:{name:'followingId',allowNull:false},as:'followers'});
UserFollow.belongsTo(User,{foreignKey:{name:'followingId',allowNull:false},as:'followed'});
UserBlock.belongsTo(User,{foreignKey:{name:'blockerId',allowNull:false},as:'blocker'});
UserBlock.belongsTo(User,{foreignKey:{name:'blockedId',allowNull:false},as:'blocked'});
Post.hasMany(PostReport,{foreignKey:{name:'postId',allowNull:false},as:'reports',onDelete:'CASCADE'});
PostReport.belongsTo(Post,{foreignKey:{name:'postId',allowNull:false},as:'post'});
PostReport.belongsTo(User,{foreignKey:{name:'reporterId',allowNull:false},as:'reporter'});

module.exports = { Payment, Ticket, sequelize, User, Venue, Event, TicketLot, Order, Favorite, State, City, Post, PostLike, PostComment, UserFollow, UserBlock, PostReport };

